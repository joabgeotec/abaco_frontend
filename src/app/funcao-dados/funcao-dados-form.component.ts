import { Der } from './../der/der.model';
import { TranslateService } from '@ngx-translate/core';
import { EntityToJSON } from './../shared/entity-to-json';
import { Component, OnInit, ChangeDetectorRef, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { FuncaoDados } from './funcao-dados.model';
import { FatorAjuste } from '../fator-ajuste';
import { FuncaoAnalise } from './../analise-shared/funcao-analise';
import { BaselineAnalitico } from './../baseline/baseline-analitico.model';
import { BaselineService } from './../baseline/baseline.service';
import { AnaliseSharedDataService, PageNotificationService, ResponseWrapper } from '../shared';
import { Analise, AnaliseService } from '../analise';

import * as _ from 'lodash';
import { Funcionalidade } from '../funcionalidade/index';
import { SelectItem } from 'primeng/primeng';
import { BlockUI, NgBlockUI } from 'ng-block-ui';
import { Calculadora } from '../analise-shared/calculadora';
import { DatatableClickEvent } from '@basis/angular-components';
import { ConfirmationService } from 'primeng/primeng';
import { ResumoFuncoes } from '../analise-shared/resumo-funcoes';
import { AfterViewInit, AfterContentInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { Subscription } from 'rxjs/Subscription';

import { FatorAjusteLabelGenerator } from '../shared/fator-ajuste-label-generator';
import { DerChipItem } from '../analise-shared/der-chips/der-chip-item';
import { DerChipConverter } from '../analise-shared/der-chips/der-chip-converter';
import { AnaliseReferenciavel } from '../analise-shared/analise-referenciavel';
import { FuncaoDadosService } from './funcao-dados.service';
import { AnaliseSharedUtils } from '../analise-shared/analise-shared-utils';
import { Manual } from '../manual';
import { Modulo } from '../modulo';
import { DerTextParser, ParseResult } from '../analise-shared/der-text/der-text-parser';
import { forEach } from '../../../node_modules/@angular/router/src/utils/collection';
import { Impacto } from '../analise-shared/impacto-enum';

import { FuncaoTransacao, TipoFuncaoTransacao } from './../funcao-transacao/funcao-transacao.model';
import { CalculadoraTransacao } from './../analise-shared/calculadora-transacao';
import { fcall } from 'q';
import { Alr } from '../alr/alr.model';

@Component({
    selector: 'app-analise-funcao-dados',
    templateUrl: './funcao-dados-form.component.html'
})
export class FuncaoDadosFormComponent implements OnInit, OnDestroy {

    @Output()
    valueChange: EventEmitter<string> = new EventEmitter<string>();
    parseResult: ParseResult;
    text: string;
    @Input()
    label: string;

    faS: FatorAjuste[] = [];

    textHeader: string;
    @Input() isView: boolean;
    @BlockUI() blockUI: NgBlockUI;      // Usado para bloquear o sistema enquanto aguarda resolução das requisições do backend
    isEdit: boolean;
    crudExist: boolean = false;
    nomeInvalido;
    isSaving: boolean;
    listaFD: string[];
    classInvalida;
    impactoInvalido: boolean;
    hideElementTDTR: boolean;
    hideShowQuantidade: boolean;
    showDialog = false;
    showMultiplos = false;
    sugestoesAutoComplete: string[] = [];
    impactos: string[];

    windowHeightDialog: any;
    windowWidthDialog: any;

    moduloCache: Funcionalidade;
    dersChips: DerChipItem[] = [];
    rlrsChips: DerChipItem[] = [];
    resumo: ResumoFuncoes;
    fatoresAjuste: SelectItem[] = [];
    colunasOptions: SelectItem[];
    colunasAMostrar = [];
    dadosBaselineFD: BaselineAnalitico[] = [];
    results: string[];
    baselineResults: any[] = [];
    funcoesDadosList: FuncaoDados[] = [];
    funcaoDadosEditar: FuncaoDados;

    impacto: SelectItem[] = [
        { label: 'Inclusão', value: 'INCLUSAO' },
        { label: 'Alteração', value: 'ALTERACAO' },
        { label: 'Exclusão', value: 'EXCLUSAO' },
        { label: 'Conversão', value: 'CONVERSAO' },
        { label: 'Outros', value: 'ITENS_NAO_MENSURAVEIS' }
    ];

    classificacoes: SelectItem[] = [
        { label: 'ALI - Arquivo Lógico Interno', value: 'ALI' },
        { label: 'AIE - Arquivo de Interface Externa', value: 'AIE' }
    ];

    private fatorAjusteNenhumSelectItem = { label: 'Nenhum', value: undefined };
    private analiseCarregadaSubscription: Subscription;
    private subscriptionSistemaSelecionado: Subscription;
    private nomeDasFuncoesDoSistema: string[] = [];
    public erroModulo: boolean;
    public erroTR: boolean;
    public erroTD: boolean;
    public erroUnitario: boolean;
    public erroDeflator: boolean;

    constructor(
        private analiseSharedDataService: AnaliseSharedDataService,
        private confirmationService: ConfirmationService,
        private pageNotificationService: PageNotificationService,
        private changeDetectorRef: ChangeDetectorRef,
        private funcaoDadosService: FuncaoDadosService,
        private analiseService: AnaliseService,
        private baselineService: BaselineService,
        private translate: TranslateService
    ) {
        const colunas = [
            { header: 'Nome', field: 'name' },
            { header: 'Deflator' },
            { header: 'Impacto', field: 'impacto' },
            { header: 'Módulo' },
            { header: 'Funcionalidade' },
            { header: 'Classificação', field: 'tipo' },
            { header: 'DER (TD)' },
            { header: 'RLR (TR)' },
            { header: 'Complexidade', field: 'complexidade' },
            { header: 'PF - Total' },
            { header: 'PF - Ajustado' }
        ];

        this.colunasOptions = colunas.map((col, index) => {
            col['index'] = index;
            return {
                label: col.header,
                value: col,
            };
        });
    }

    getLabel(label) {
        let str: any;
        this.translate.get(label).subscribe((res: string) => {
            str = res;
        }).unsubscribe();
        return str;
    }

    ngOnInit() {
        this.estadoInicial();
        this.impactos = AnaliseSharedUtils.impactos;
    }

    estadoInicial() {
        this.isSaving = false;
        this.hideShowQuantidade = true;
        this.currentFuncaoDados = new FuncaoDados();
        this.subscribeToAnaliseCarregada();
        this.colunasAMostrar = [];
        this.colunasOptions.map(selectItem => this.colunasAMostrar.push(selectItem.value));
        this.traduzirColunas();
        this.traduzirClassificacoes();
        this.traduzirImpactos();
    }

    public onRowDblclick(event) {
        if (event.target.nodeName === 'TD') {
            this.abrirEditar();
        } else if (event.target.parentNode.nodeName === 'TD') {
            this.abrirEditar();
        }
    }

    selectRow(event) {
        this.funcaoDadosEditar = event.data.clone();
    }

    abrirEditar() {
        this.isEdit = true;
        this.prepararParaEdicao(this.funcaoDadosEditar);
    }
    /*
    *   Metodo responsavel por traduzir as colunas que ficam em função de dados de Analise
    */
    traduzirColunas() {
        this.translate.stream(['Cadastros.FuncaoDados.Nome', 'Cadastros.FuncaoDados.Deflator', 'Cadastros.FuncaoDados.Impacto',
            'Cadastros.FuncaoDados.Modulo', 'Cadastros.FuncaoDados.Funcionalidade', 'Cadastros.FuncaoDados.Classificacao',
            'Cadastros.FuncaoDados.DER(TD)', 'Cadastros.FuncaoDados.RLR(TR)', 'Cadastros.FuncaoDados.Complexidade',
            'Cadastros.FuncaoDados.PFTotal', 'Cadastros.FuncaoDados.PFAjustado']).subscribe((traducao) => {
                this.colunasAMostrar = [
                    { header: traducao['Cadastros.FuncaoDados.Nome'], field: 'name' },
                    { header: traducao['Cadastros.FuncaoDados.Deflator'] },
                    { header: traducao['Cadastros.FuncaoDados.Impacto'], field: 'impacto' },
                    { header: traducao['Cadastros.FuncaoDados.Modulo'] },
                    { header: traducao['Cadastros.FuncaoDados.Funcionalidade'] },
                    { header: traducao['Cadastros.FuncaoDados.Classificacao'], field: 'tipo' },
                    { header: traducao['Cadastros.FuncaoDados.DER(TD)'] },
                    { header: traducao['Cadastros.FuncaoDados.RLR(TR)'] },
                    { header: traducao['Cadastros.FuncaoDados.Complexidade'], field: 'complexidade' },
                    { header: traducao['Cadastros.FuncaoDados.PFTotal'] },
                    { header: traducao['Cadastros.FuncaoDados.PFAjustado'] }
                ];

            })
    }

    /*
    *   Metodo responsavel por traduzir as classificacoes que ficam em função de dados 
    */
    traduzirClassificacoes() {
        this.translate.stream(['Cadastros.FuncaoDados.Classificacoes.ALI', 'Cadastros.FuncaoDados.Classificacoes.AIE']).subscribe((traducao) => {
            this.classificacoes = [
                { label: traducao['Cadastros.FuncaoDados.Classificacoes.ALI'], value: 'ALI' },
                { label: traducao['Cadastros.FuncaoDados.Classificacoes.AIE'], value: 'AIE' },
            ];

        })
    }

    /*
    *   Metodo responsavel por traduzir os tipos de impacto em função de dados 
    */
    traduzirImpactos() {
        this.translate.stream(['Cadastros.FuncaoDados.Impactos.Inclusao', 'Cadastros.FuncaoDados.Impactos.Alteracao', 
        'Cadastros.FuncaoDados.Impactos.Exclusao', 'Cadastros.FuncaoDados.Impactos.Conversao',
        'Cadastros.FuncaoDados.Impactos.Outros']).subscribe((traducao) => {
            this.impacto = [
                { label: traducao['Cadastros.FuncaoDados.Impactos.Inclusao'], value: 'INCLUSAO' },
                { label: traducao['Cadastros.FuncaoDados.Impactos.Alteracao'], value: 'ALTERACAO' },
                { label: traducao['Cadastros.FuncaoDados.Impactos.Exclusao'], value: 'EXCLUSAO' },
                { label: traducao['Cadastros.FuncaoDados.Impactos.Conversao'], value: 'CONVERSAO' },
                { label: traducao['Cadastros.FuncaoDados.Impactos.Outros'], value: 'ITENS_NAO_MENSURAVEIS' }
            ];
        })
    }

    updateNameImpacto(impacto: string) {
        switch (impacto) {
            case 'INCLUSAO':
                return this.getLabel('Cadastros.FuncaoDados.Inclusao');
            case 'ALTERACAO':
                return this.getLabel('Cadastros.FuncaoDados.Alteracao');
            case 'EXCLUSAO':
                return this.getLabel('Cadastros.FuncaoDados.Exclusao');
            case 'CONVERSAO':
                return this.getLabel('Cadastros.FuncaoDados.Conversao');
            //break;

        }
    }

    public buttonSaveEdit() {

        if (this.isEdit) {
            this.editar();
        } else {
            if (this.showMultiplos) {
                let retorno = true;
                for (const nome of this.parseResult.textos) {
                    this.currentFuncaoDados.name = nome;
                    if (!this.multiplos()) {
                        retorno = false;
                        break;
                    }
                }
                if (retorno) {
                    this.analise.funcaoDados.concat(this.funcoesDadosList);
                    this.salvarAnalise();
                    this.subscribeToAnaliseCarregada();
                    this.fecharDialog();
                }
            } else {
                if (this.adicionar()) {
                    this.fecharDialog();
                }
            }
        }
        if (this.blockUI.isActive) {
            this.blockUI.stop();
        }
    }

    disableTRDER() {
        this.hideElementTDTR = this.analiseSharedDataService.analise.metodoContagem === 'INDICATIVA'
            || this.analiseSharedDataService.analise.metodoContagem === 'ESTIMADA';
    }

    private subscribeToAnaliseCarregada() {
        this.analiseCarregadaSubscription = this.analiseSharedDataService.getLoadSubject().subscribe(() => {
            this.atualizaResumo();
            //  this.loadDataFunctionsName();
        });
    }

    public carregarDadosBaseline() {
        this.baselineService.baselineAnaliticoFD(this.analise.sistema.id).subscribe((res: ResponseWrapper) => {
            this.dadosBaselineFD = res.json;
        });
    }

    private atualizaResumo() {
        this.resumo = this.analise.resumoFuncaoDados;
        this.changeDetectorRef.detectChanges();
    }

    private subscribeToSistemaSelecionado() {
        this.subscriptionSistemaSelecionado = this.analiseSharedDataService.getSistemaSelecionadoSubject()
            .subscribe(() => {
                this.loadDataFunctionsName();
            });
    }

    searchBaseline(event): void {
        let mdCache = this.moduloCache;
        this.baselineResults = this.dadosBaselineFD.filter(function (fc) {
            var teste: string = event.query;
            return fc.name.toLowerCase().includes(teste.toLowerCase()) && fc.idfuncionalidade == mdCache.id;
        });
    }

    // Carrega nome das funçeõs de dados
    private loadDataFunctionsName() {
        const sistemaId: number = this.analiseSharedDataService.analise.sistema.id;
        this.funcaoDadosService.findAllNamesBySistemaId(sistemaId).subscribe(
            nomes => {
                this.nomeDasFuncoesDoSistema = nomes;
                this.sugestoesAutoComplete = nomes.slice();

            });
    }

    autoCompleteNomes(event) {

        // TODO qual melhor método? inclues? startsWith ignore case?
        this.sugestoesAutoComplete = this.nomeDasFuncoesDoSistema

            .filter(nomeFuncao => nomeFuncao.startsWith(event.query));
    }

    getTextDialog() {
        this.textHeader = this.isEdit ? this.getLabel('Cadastros.FuncaoDados.Mensagens.msgAlterarFuncaoDados') : this.getLabel('Cadastros.FuncaoDados.Mensagens.msgAdicionarFuncaoDados');
    }

    get currentFuncaoDados(): FuncaoDados {
        return this.analiseSharedDataService.currentFuncaoDados;
    }

    set currentFuncaoDados(currentFuncaoDados: FuncaoDados) {
        this.analiseSharedDataService.currentFuncaoDados = currentFuncaoDados;
    }

    get funcoesDados(): FuncaoDados[] {
        if (!this.analise.funcaoDados) {
            return [];
        }
        return this.analise.funcaoDados;
    }

    private get analise(): Analise {
        return this.analiseSharedDataService.analise;
    }

    private get manual() {
        if (this.analiseSharedDataService.analise.manual) {
            if (
                this.analiseSharedDataService.analise.manual.fatoresAjuste &&
                this.analiseSharedDataService.analise.manual.fatoresAjuste.length === 0
            ) {
                this.funcaoDadosService.getManualDeAnalise(
                    this.analiseSharedDataService.analise.manual.id
                ).subscribe(manual => {
                    this.analiseSharedDataService.analise.manual = manual;
                });
            }
            return this.analiseSharedDataService.analise.manual;
        }
        return undefined;
    }

    isContratoSelected(): boolean {
        const isContratoSelected = this.analiseSharedDataService.isContratoSelected();
        if (isContratoSelected) {
            if (this.fatoresAjuste.length === 0) {
                this.inicializaFatoresAjuste(this.analise.manual);
            }
        }
        return isContratoSelected;
    }

    contratoSelecionado() {
        if (this.currentFuncaoDados.fatorAjuste.tipoAjuste === 'UNITARIO') {
            this.hideShowQuantidade = this.currentFuncaoDados.fatorAjuste === undefined;
        } else {
            this.currentFuncaoDados.quantidade = undefined;
            this.hideShowQuantidade = true;
            this.currentFuncaoDados.quantidade = undefined;
        }
    }

    fatoresAjusteDropdownPlaceholder() {
        if (this.isContratoSelected()) {
            return this.getLabel('Cadastros.FuncaoDados.Mensagens.msgSelecioneDeflator');
        } else {
            return this.getLabel('Cadastros.FuncaoDados.Mensagens.msgSelecioneContratoParaCarregarDeflatores');
        }
    }

    // Funcionalidade Selecionada
    functionalitySelected(funcionalidade: Funcionalidade) {
        if (funcionalidade) { // necessario?
            this.moduloCache = funcionalidade;
        }
        this.currentFuncaoDados.funcionalidade = funcionalidade;
        this.carregarDadosBaseline();
    }

    multiplos(): boolean {
        const retorno: boolean = this.verifyDataRequire();
        if (!retorno) {
            this.pageNotificationService.addErrorMsg(this.getLabel('Global.Mensagens.FavorPreencherCampoObrigatorio'));
            return false;
        } else {
            this.desconverterChips();
            this.verificarModulo();
            const funcaoDadosCalculada = Calculadora.calcular(
                this.analise.metodoContagem, this.currentFuncaoDados, this.analise.contrato.manual);
            this.funcoesDadosList.push(funcaoDadosCalculada);
            this.analise.addFuncaoDados(funcaoDadosCalculada);
            this.atualizaResumo();
            this.resetarEstadoPosSalvar();
            return true;
        }
    }

    validarNameFuncaoTransacaos(ft: FuncaoTransacao) {
        const that = this;
        return new Promise(resolve => {
            if (that.analise.funcaoTransacaos.length === 0) {
                return resolve(true);
            }
            that.analise.funcaoTransacaos.forEach((data, index) => {
                if (data.comprar(ft)) {
                    return resolve(false);
                }
                if (!that.analise.funcaoTransacaos[index + 1]) {
                    return resolve(true);
                }
            });
        });
    }

    adicionar(): boolean {
        const retorno: boolean = this.verifyDataRequire();
        if (!retorno) {
            this.pageNotificationService.addErrorMsg(this.getLabel('Global.Mensagens.FavorPreencherCampoObrigatorio'));
            return retorno;
        } else {
            this.desconverterChips();
            this.verificarModulo();
            const funcaoDadosCalculada = Calculadora.calcular(this.analise.metodoContagem,
                this.currentFuncaoDados,
                this.analise.contrato.manual);
            this.validarNameFuncaoDados(this.currentFuncaoDados).then(resolve => {
                if (resolve) {
                    this.pageNotificationService.addCreateMsgWithName(funcaoDadosCalculada.name);
                    this.analise.addFuncaoDados(funcaoDadosCalculada);
                    this.atualizaResumo();
                    this.resetarEstadoPosSalvar();
                    this.salvarAnalise();
                    this.estadoInicial();
                } else {
                    this.pageNotificationService.addErrorMsg(this.getLabel('Global.Mensagens.RegistroCadastrado'));
                }
            });
        }
        return retorno;
    }

    /* Verificar esta promisse */
    validarNameFuncaoDados(fd: FuncaoDados) {
        const that = this;
        return new Promise(resolve => {
            if (that.analise.funcaoDados.length === 0) {
                return resolve(true);
            }
            if (that.analise.funcaoDados) {
                that.analise.funcaoDados.forEach((data, index) => {
                    if (data.comprar(fd)) {
                        return resolve(false);
                    }
                    if (!that.analise.funcaoDados[index + 1]) {
                        return resolve(true);
                    }
                });
            }
        });
    }

    private verifyDataRequire(): boolean {
        let retorno = true;

        if (!this.currentFuncaoDados.name) {
            this.nomeInvalido = true;
            retorno = false;
        } else {
            this.nomeInvalido = false;
        }

        if (!this.currentFuncaoDados.tipo) {
            this.classInvalida = true;
            retorno = false;
        } else {
            this.classInvalida = false;
        }

        if (!this.currentFuncaoDados.impacto) {
            this.impactoInvalido = true;
            retorno = false;
        } else {
            this.impactoInvalido = false;
        }

        if (this.currentFuncaoDados.impacto) {
            if (this.currentFuncaoDados.impacto.indexOf('ITENS_NAO_MENSURAVEIS') === 0 && this.currentFuncaoDados.fatorAjuste === undefined) {
                this.erroDeflator = false;
                retorno = false;
                this.pageNotificationService.addErrorMsg(this.getLabel('Cadastros.FuncaoDados.Mensagens.msgSelecioneDeflator'));
            }
        }
        else {
            this.erroDeflator = true;
        }

        if (this.currentFuncaoDados.fatorAjuste) {
            if (this.currentFuncaoDados.fatorAjuste.tipoAjuste === 'UNITARIO' &&
                this.currentFuncaoDados.quantidade === undefined) {
                this.erroUnitario = true;
                retorno = false;
            } else {
                this.erroUnitario = false;
            }
        }

        if (this.analiseSharedDataService.analise.metodoContagem === 'DETALHADA') {

            if (!this.rlrsChips || this.rlrsChips.length < 1) {
                this.erroTR = true;
                retorno = false;
            } else {
                this.erroTR = false;
            }

            if (!this.dersChips || this.dersChips.length < 1) {
                this.erroTD = true;
                retorno = false;
            } else {
                this.erroTD = false;
            }
        }

        if (this.currentFuncaoDados.funcionalidade === undefined) {
            this.pageNotificationService.addErrorMsg(this.getLabel('Cadastros.FuncaoDados.Mensagens.msgSelecioneModuloFuncionalidade'));
            this.erroModulo = true;
            retorno = false;
        }
        else {
            this.erroModulo = false;
        }

        return retorno;
    }

    salvarAnalise() {
        this.analiseService.atualizaAnalise(this.analise);
    }

    private desconverterChips() {
        if (this.dersChips != null && this.rlrsChips != null) {
            this.currentFuncaoDados.ders = DerChipConverter.desconverterEmDers(this.dersChips);
            this.currentFuncaoDados.rlrs = DerChipConverter.desconverterEmRlrs(this.rlrsChips);
        }
    }

    private editar() {

        const retorno: boolean = this.verifyDataRequire();
        if (!retorno) {
            this.pageNotificationService.addErrorMsg(this.getLabel('Global.Mensagens.FavorPreencherCampoObrigatorio'));
            return;
        } else {
            this.desconverterChips();
            this.verificarModulo();
            const funcaoDadosCalculada = Calculadora.calcular(
                this.analise.metodoContagem, this.currentFuncaoDados, this.analise.contrato.manual);
            this.validarNameFuncaoDados(this.currentFuncaoDados).then(resolve => {
                if(resolve) {
                    this.pageNotificationService.addSuccessMsg(`${this.getLabel('Cadastros.FuncaoDados.Mensagens.msgFuncaoDados')} '${funcaoDadosCalculada.name}' ${this.getLabel('Cadastros.FuncaoDados.msgAlteradaComSucesso')}`);
                    this.analise.updateFuncaoDados(funcaoDadosCalculada);
                    this.atualizaResumo();
                    this.resetarEstadoPosSalvar();
                    this.salvarAnalise();
                    this.fecharDialog();
                } else {
                    this.pageNotificationService.addErrorMsg(this.getLabel('Global.Mensagens.RegistroCadastrado'));
                }
            });
        }
    }

    fecharDialog() {
        this.text = undefined;
        this.limparMensagensErros();
        this.showDialog = false;
        this.analiseSharedDataService.funcaoAnaliseDescarregada();
        this.currentFuncaoDados = new FuncaoDados();
        this.dersChips = [];
        this.rlrsChips = [];
        window.scrollTo(0, 60);
    }

    limparMensagensErros() {
        this.nomeInvalido = false;
        this.classInvalida = false;
        this.impactoInvalido = false;
        this.erroModulo = false;
        this.erroUnitario = false;
        this.erroTR = false;
        this.erroTD = false;
        this.erroDeflator = false;
    }

    private resetarEstadoPosSalvar() {
        this.currentFuncaoDados = this.currentFuncaoDados.clone();

        this.currentFuncaoDados.artificialId = undefined;
        this.currentFuncaoDados.id = undefined;

        if (this.dersChips && this.rlrsChips) {
            this.dersChips.forEach(c => c.id = undefined);
            this.rlrsChips.forEach(c => c.id = undefined);
        }

    }

    public verificarModulo() {
        if (this.currentFuncaoDados.funcionalidade !== undefined) {
            return;
        }
        this.currentFuncaoDados.funcionalidade = this.moduloCache;
    }

    classValida() {
        this.classInvalida = false;
    }

    impactoValido() {
        this.impactoInvalido = false;
    }

    /**
     * Método responsável por recuperar o nome selecionado no combo.
     * @param nome
     */
    recuperarNomeSelecionado(baselineAnalitico: BaselineAnalitico) {

        this.funcaoDadosService.getFuncaoDadosBaseline(baselineAnalitico.idfuncaodados)
            .subscribe((res: FuncaoDados) => {
                if (res.fatorAjuste === null) {
                    res.fatorAjuste = undefined;
                }
                res.id = undefined;
                if (res.ders) {
                    res.ders.forEach(Ders => {
                        Ders.id = undefined;
                    });
                }
                if (res.rlrs) {
                    res.rlrs.forEach(rlrs => {
                        rlrs.id = undefined;
                    });
                }

                this.prepararParaEdicao(res);
            });

    }

    datatableClick(event: DatatableClickEvent) {
        if (!event.selection) {
            return;
        }

        let funcaoDadosSelecionada: FuncaoDados = event.selection.clone();
        switch (event.button) {
            case 'edit':
                this.isEdit = true;
                this.prepararParaEdicao(funcaoDadosSelecionada);
                break;
            case 'delete':
                this.confirmDelete(funcaoDadosSelecionada);
                break;
            case 'clone':
                this.disableTRDER();
                this.configurarDialog();
                this.isEdit = false;
                this.prepareToClone(funcaoDadosSelecionada);
                this.currentFuncaoDados.id = undefined;
                this.currentFuncaoDados.artificialId = undefined;
                this.currentFuncaoDados.impacto = Impacto.ALTERACAO;
                this.textHeader = this.getLabel('Cadastros.FuncaoDados.Mensagens.msgClonarFuncaoDados')
                break;
            case 'crud':
                this.createCrud(funcaoDadosSelecionada);
        }
    }

    inserirCrud(funcaoTransacaoAtual: FuncaoTransacao) {

        this.desconverterChips();
        this.verificarModulo();

        const funcaoTransacaoCalculada = CalculadoraTransacao.calcular(this.analise.metodoContagem,
                                                                    funcaoTransacaoAtual,
                                                                    this.analise.contrato.manual);

        this.validarNameFuncaoTransacaos(funcaoTransacaoAtual).then( resolve => {
            if (resolve) {
                this.pageNotificationService.addCreateMsgWithName(funcaoTransacaoCalculada.name);
                this.analise.addFuncaoTransacao(funcaoTransacaoCalculada);
                this.atualizaResumo();
                this.resetarEstadoPosSalvar();
                // this.persistirFuncaoTransacao(funcaoTransacaoCalculada);
                this.salvarAnalise();
                this.estadoInicial();
            } else {
                this.crudExist = true;
            }
        });
    }

    private gerarAlr(funcaoTransacaoCalculada: FuncaoTransacao, fnDado: FuncaoDados) {
        const alr = new Alr(undefined, fnDado.name, undefined, null);
        if (funcaoTransacaoCalculada.alrs !== undefined && funcaoTransacaoCalculada.alrs != null) {
            funcaoTransacaoCalculada.alrs.push(alr);
        } else {
            const alrs: Alr[] = [];
            alrs.push(alr);
            funcaoTransacaoCalculada.alrs = alrs;
        }
    }

    private createCrud(funcaoDadosSelecionada: FuncaoDados) {

        const _this = this;

        const fdExcluir = this.gerarFuncaoTransacao('Excluir', funcaoDadosSelecionada);
        this.inserirCrud(fdExcluir);

        const fdEditar = this.gerarFuncaoTransacao('Editar', funcaoDadosSelecionada);
        setTimeout(function(){
            _this.inserirCrud(fdEditar);
        }, 1000);

        const fdInserir = this.gerarFuncaoTransacao('Inserir', funcaoDadosSelecionada);
        setTimeout(function(){
            _this.inserirCrud(fdInserir);
        }, 2000);

        const fdPesquisar = this.gerarFuncaoTransacao('Pesquisar', funcaoDadosSelecionada);
        setTimeout(function(){
            _this.inserirCrud(fdPesquisar);
        }, 3000);

        if (this.crudExist) {
            this.pageNotificationService.addErrorMsg('CRUD já cadastrado!');
        }
    }

    private gerarFuncaoTransacao(tipo: string, fdSelecionada: FuncaoDados): FuncaoTransacao {
        const ft = new FuncaoTransacao();
        ft.name = tipo;
        ft.funcionalidade = fdSelecionada.funcionalidade;
        ft.tipo = tipo === 'Pesquisar' ? TipoFuncaoTransacao.CE : TipoFuncaoTransacao.EE;
        ft.impacto = Impacto.INCLUSAO;
        ft.fatorAjuste = fdSelecionada.fatorAjuste;
        ft.ders = [];
        fdSelecionada.ders.forEach(item => ft.ders.push(item));
        this.criarDersMenssagemAcao(ft.ders);
        this.gerarAlr(ft, fdSelecionada);
        return ft;
    }

    private criarDersMenssagemAcao(ders: Der[]) {
        ders.push(new Der(undefined, 'Menssagem'));
        ders.push(new Der(undefined, 'Ação'));
    }

    private persistirFuncaoTransacao(ft: FuncaoTransacao) {
        this.funcaoDadosService.gerarCrud(ft);
    }

    private prepararParaEdicao(funcaoDadosSelecionada: FuncaoDados) {

        this.disableTRDER();
        this.configurarDialog();

        this.currentFuncaoDados = funcaoDadosSelecionada;

        this.carregarValoresNaPaginaParaEdicao(funcaoDadosSelecionada);
        this.pageNotificationService.addInfoMsg(`${this.getLabel('Cadastros.FuncaoDados.Mensagens.msgAlterandoFuncaoDados')} '${funcaoDadosSelecionada.name}'`);
    }

    // Prepara para clonar
    private prepareToClone(funcaoDadosSelecionada: FuncaoDados) {
        this.analiseSharedDataService.currentFuncaoDados = funcaoDadosSelecionada;
        this.currentFuncaoDados.name = this.currentFuncaoDados.name + this.getLabel('Cadastros.FuncaoDados.Copia');
        this.carregarValoresNaPaginaParaEdicao(funcaoDadosSelecionada);
        this.pageNotificationService.addInfoMsg(`${this.getLabel('Cadastros.FuncaoDados.Mensagens.msgClonandoFuncaoDados')} '${funcaoDadosSelecionada.name}'`);
    }

    private carregarValoresNaPaginaParaEdicao(funcaoDadosSelecionada: FuncaoDados) {
        /* Envia os dados para o componente modulo-funcionalidade-component.ts*/
        this.funcaoDadosService.mod.next(funcaoDadosSelecionada.funcionalidade);

        this.analiseSharedDataService.funcaoAnaliseCarregada();
        this.carregarDerERlr(funcaoDadosSelecionada);
        this.carregarFatorDeAjusteNaEdicao(funcaoDadosSelecionada);
    }

    private carregarFatorDeAjusteNaEdicao(funcaoSelecionada: FuncaoDados) {
        this.inicializaFatoresAjuste(this.analise.manual);
        if (funcaoSelecionada.fatorAjuste !== undefined) {
            funcaoSelecionada.fatorAjuste = _.find(this.fatoresAjuste, { value: { 'id': funcaoSelecionada.fatorAjuste.id } }).value;
        }

    }

    private carregarDerERlr(fd: FuncaoDados) {
        let ders = this.loadReference(fd.ders, fd.derValues);

        this.dersChips = ders.filter(der => {
            return !(der.text === 'Mensagem' || der.text === 'Ação');
        });
        this.rlrsChips = this.loadReference(fd.rlrs, fd.rlrValues);
    }

    moduloSelected(modulo: Modulo) {
    }

    // Carregar Referencial
    private loadReference(referenciaveis: AnaliseReferenciavel[],
        strValues: string[]): DerChipItem[] {

        if (referenciaveis) {
            if (referenciaveis.length > 0) {
                return DerChipConverter.converterReferenciaveis(referenciaveis);
            } else {
                return DerChipConverter.converter(strValues);
            }
        } else {
            return DerChipConverter.converter(strValues);
        }
    }

    cancelar() {
        this.showDialog = false;
        this.fecharDialog();
    }


    confirmDelete(funcaoDadosSelecionada: FuncaoDados) {
        this.confirmationService.confirm({
            message: `${this.getLabel('Cadastros.FuncaoDados.Mensagens.msgCertezaDesejaExcluirFuncaoDados')} '${funcaoDadosSelecionada.name}'?`,
            accept: () => {
                this.analise.deleteFuncaoDados(funcaoDadosSelecionada);
                this.salvarAnalise();
                this.pageNotificationService.addDeleteMsgWithName(funcaoDadosSelecionada.name);
            }
        });
    }

    formataFatorAjuste(fatorAjuste: FatorAjuste): string {
        return fatorAjuste ? FatorAjusteLabelGenerator.generate(fatorAjuste) : this.getLabel('Global.Mensagens.Nenhum');
    }

    ordenarColunas(colunasAMostrarModificada: SelectItem[]) {
        this.colunasAMostrar = colunasAMostrarModificada;
        this.colunasAMostrar = _.sortBy(this.colunasAMostrar, col => col.index);
    }

    ngOnDestroy() {
        this.changeDetectorRef.detach();
        this.analiseCarregadaSubscription.unsubscribe();
    }

    openDialog(param: boolean) {
        this.subscribeToAnaliseCarregada();
        this.isEdit = param;
        this.disableTRDER();
        this.configurarDialog();
        this.currentFuncaoDados.fatorAjuste = this.faS[0];
        if (this.currentFuncaoDados.fatorAjuste.tipoAjuste === 'UNITARIO' && this.faS[0]) {
            this.hideShowQuantidade = false;
        } else {
            this.hideShowQuantidade = true;
        }

    }

    configurarDialog() {
        this.getTextDialog();
        this.windowHeightDialog = window.innerHeight * 0.60;
        this.windowWidthDialog = window.innerWidth * 0.50;
        this.showDialog = true;
    }

    private inicializaFatoresAjuste(manual: Manual) {
        if (manual.fatoresAjuste) {
            this.faS = _.cloneDeep(manual.fatoresAjuste);
            this.faS.sort((n1, n2) => {
                if (n1.fator < n2.fator)
                    return 1;
                if (n1.fator > n2.fator)
                    return -1;
                return 0;
            });

            this.fatoresAjuste =
                this.faS.map(fa => {
                    const label = FatorAjusteLabelGenerator.generate(fa);
                    return { label: label, value: fa };
                });

            //Label "Nenhum" comentada
            //this.fatoresAjuste.unshift(this.fatorAjusteNenhumSelectItem);
        }
    }

    textChanged() {
        this.valueChange.emit(this.text);
        this.parseResult = DerTextParser.parse(this.text);
    }

    buttonMultiplos() {
        this.showMultiplos = !this.showMultiplos;
    }

}
