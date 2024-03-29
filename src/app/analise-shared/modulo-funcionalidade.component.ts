import { TranslateService } from '@ngx-translate/core';
import {
    Component, OnInit, Input, Output,
    EventEmitter, ChangeDetectorRef, OnDestroy
} from '@angular/core';
import { AnaliseSharedDataService, PageNotificationService } from '../shared';
import { Analise } from '../analise';
import { Manual } from '../manual';
import { FatorAjuste } from '../fator-ajuste';
import { Sistema, SistemaService } from '../sistema/index';
import { Modulo, ModuloService } from '../modulo';
import { Funcionalidade, FuncionalidadeService } from '../funcionalidade';
import { Subscription } from 'rxjs/Subscription';

import * as _ from 'lodash';
import { FuncaoDadosService } from '../funcao-dados/funcao-dados.service';

@Component({
    selector: 'app-analise-modulo-funcionalidade',
    templateUrl: './modulo-funcionalidade.component.html'
})

// TODO muito complexo. REFATORAR
// talvez quebrar num componente filho só para funcionalidade
// que observa um output daqui de modulo selecionado
export class ModuloFuncionalidadeComponent implements OnInit, OnDestroy {

    @Input()
    isFuncaoDados: boolean;

    @Input() moduloNameParam: boolean;

    @Output()
    moduloSelectedEvent = new EventEmitter<Modulo>();

    @Output()
    funcionalidadeSelectedEvent = new EventEmitter<Funcionalidade>();

    private subscriptionSistemaSelecionado: Subscription;
    private subscriptionAnaliseSalva: Subscription;
    private subscriptionAnaliseCarregada: Subscription;
    private subscriptionFuncaoAnaliseCarregada: Subscription;
    private subscriptionFuncaoAnaliseDescarregada: Subscription;

    private oldModuloSelectedId = -1;

    modulos: Modulo[];
    mostrarDialogModulo = false;
    novoModulo: Modulo = new Modulo();
    moduloSelecionado: Modulo;
    @Input() erroModulo: boolean;

    funcionalidades: Funcionalidade[];
    mostrarDialogFuncionalidade = false;
    novaFuncionalidade: Funcionalidade = new Funcionalidade();
    funcionalidadeSelecionada: Funcionalidade;

    constructor(
        private analiseSharedDataService: AnaliseSharedDataService,
        private moduloService: ModuloService,
        private sistemaService: SistemaService,
        private funcionalidadeService: FuncionalidadeService,
        private changeDetectorRef: ChangeDetectorRef,
        private pageNotificationService: PageNotificationService,
        private funcaoDadosService: FuncaoDadosService,
        private translate: TranslateService
    ) {
    }

    getLabel(label) {
        let str: any;
        this.translate.get(label).subscribe((res: string) => {
            str = res;
        }).unsubscribe();
        return str;
    }

    ngOnInit() {
        if (_.isUndefined(this.isFuncaoDados)) {
            throw new Error('input isFuncaoDados é obrigatório.');
        }
        this.estadoinicial();
    }

    estadoinicial() {
        this.subscribeSistemaSelecionado();
        this.subscribeAnaliseCarregada();
        this.subscribeAnaliseSalva();
        this.subscribeFuncaoAnaliseCarregada();
        this.subscribeFuncaoAnaliseDescarregada();
        this.subscribeFuncionalideBaseline();
    }

    private subscribeFuncionalideBaseline() {
        this.funcaoDadosService.dataModd$.subscribe(
            (data: Funcionalidade) => {
                this.funcionalidades = data.modulo.funcionalidades;
                this.selecionarModuloBaseline(data.modulo.id, data.id);
            });
    }

    private subscribeSistemaSelecionado() {
        this.subscriptionSistemaSelecionado =
            this.analiseSharedDataService.getSistemaSelecionadoSubject().subscribe(() => {
                this.carregarModulosQuandoTiverSistemaDisponivel();
            });
    }

    private carregarModulosQuandoTiverSistemaDisponivel() {
        const sistemaId = this.sistema.id;
        this.sistemaService.find(sistemaId).subscribe((sistemaRecarregado: Sistema) => {
            this.recarregarSistema(sistemaRecarregado);
            this.modulos = sistemaRecarregado.modulos;
        });
        this.changeDetectorRef.detectChanges();
    }

    private get sistema(): Sistema {
        return this.analiseSharedDataService.analise.sistema;
    }

    private subscribeAnaliseCarregada() {
        this.subscriptionAnaliseCarregada = this.analiseSharedDataService.getLoadSubject().subscribe(() => {
            if (this.sistema) {
                this.carregarModulosQuandoTiverSistemaDisponivel();
            }
        });
    }

    private subscribeAnaliseSalva() {
        this.subscriptionAnaliseSalva = this.analiseSharedDataService.getSaveSubject().subscribe(() => {
            this.modulos = this.sistema.modulos.slice();
            this.selectModuloOnAnaliseSalva();
            this.changeDetectorRef.detectChanges();
        });
    }

    private selectModuloOnAnaliseSalva() {
        const moduloASelecionar = this.getModuloASelecionarDeAcordoComTipoFuncaoDoComponente();
        if (moduloASelecionar) {
            this.selecionarModulo(moduloASelecionar.id);
        }
    }

    private getModuloASelecionarDeAcordoComTipoFuncaoDoComponente(): Modulo {
        if (this.currentFuncaoAnalise.funcionalidade) {
            return this.currentFuncaoAnalise.funcionalidade.modulo;
        }
    }

    // TODO pode retornar interface FuncaoAnalise. mas precisa ser complementada
    private get currentFuncaoAnalise() {
        if (this.isFuncaoDados) {
            return this.analiseSharedDataService.currentFuncaoDados;
        } else {
            return this.analiseSharedDataService.currentFuncaoTransacao;
        }
    }

    // Para selecionar no dropdown, o objeto selecionado tem que ser o mesmo da lista de opções
    private selecionarModulo(moduloId: number) {
        this.moduloSelecionado = _.find(this.modulos, { 'id': moduloId });
        this.moduloSelected(this.moduloSelecionado);
    }

    /* Seleciona no dropdown o modulo da Baseline recebido do componente funcao-dados-form-component.ts*/
    private selecionarModuloBaseline(moduloId: number, funcionalideId: number) {
        this.moduloSelecionado = _.find(this.modulos, { 'id': moduloId });
        this.funcionalidadeSelecionada = _.find(this.funcionalidades, { 'id': funcionalideId });
    }

    private subscribeFuncaoAnaliseCarregada() {
        this.subscriptionFuncaoAnaliseCarregada =
            this.analiseSharedDataService.getFuncaoAnaliseCarregadaSubject().subscribe(() => {
                this.carregarTudoOnFuncaoAnaliseCarregada();
            });
    }

    private carregarTudoOnFuncaoAnaliseCarregada() {
        if (this.isCurrentFuncaoAnaliseDefined()) {
            this.doCarregarTudoOnFuncaoAnaliseCarregada();
        }
    }

    private isCurrentFuncaoAnaliseDefined(): boolean {
        // TODO inappropriate intimacy. Pode ir pra interface FuncaoAnalise
        return !_.isUndefined(this.currentFuncaoAnalise.id) || !_.isUndefined(this.currentFuncaoAnalise.artificialId);
    }

    // TODO avaliar duplicacoes e refatorar
    private doCarregarTudoOnFuncaoAnaliseCarregada() {
        const currentFuncionalidade: Funcionalidade = this.currentFuncaoAnalise.funcionalidade;
        const currentModulo: Modulo = currentFuncionalidade.modulo;

        this.modulos = this.sistema.modulos;
        this.selecionarModulo(currentModulo.id);

        this.funcionalidades = currentModulo.funcionalidades;
        this.funcionalidadeSelecionada = _.find(this.funcionalidades, { 'id': currentFuncionalidade.id });
        this.funcionalidadeSelected(this.funcionalidadeSelecionada);
    }

    private selecionaFuncionalidadeFromCurrentAnalise() {
        const currentFuncionalidade: Funcionalidade = this.currentFuncaoAnalise.funcionalidade;
        this.funcionalidadeSelecionada = _.find(this.funcionalidades, { 'id': currentFuncionalidade.id });
    }

    private subscribeFuncaoAnaliseDescarregada() {
        this.subscriptionFuncaoAnaliseDescarregada =
            this.analiseSharedDataService.getFuncaoAnaliseDescarregadaSubject().subscribe(() => {
                this.limpaSelecoes();
            });
    }

    private limpaSelecoes() {
        // TODO undefined? new?
        this.moduloSelecionado = undefined;
        this.funcionalidadeSelecionada = undefined;
    }

    moduloName() {
        if (this.isModuloSelected()) {
            return this.moduloSelecionado.nome;
        }
    }

    isSistemaSelected(): boolean {
        return !_.isUndefined(this.sistema);
    }

    moduloDropdownPlaceholder(): string {
        if (this.isSistemaSelected()) {
            return this.moduloDropdownPlaceholderComSistemaSelecionado();
        } else {
            return this.getLabel('Analise.Analise.Mensagens.msgSelecioneSistemaParaCarregarModulos');
        }
    }

    private moduloDropdownPlaceholderComSistemaSelecionado(): string {
        if (this.sistemaTemModulos()) {
            return this.getLabel('Analise.Analise.Mensagens.msgSelecioneModulo');
        } else {
            return this.getLabel('Analise.Analise.Mensagens.msgNenhumModuloCadastrado');
        }
    }

    private sistemaTemModulos(): boolean {
        return this.sistema.modulos && this.sistema.modulos.length > 0;
    }

    abrirDialogModulo() {
        if (this.isSistemaSelected()) {
            this.mostrarDialogModulo = true;
            // XXX problema em dar new toda hora?
            this.novoModulo = new Modulo();
        }
    }

    fecharDialogModulo() {
        this.mostrarDialogModulo = false;
    }

    isModuloSelected(): boolean {
        return !_.isUndefined(this.moduloSelecionado);
    }

    moduloSelected(modulo: Modulo) {
        this.deselecionaFuncionalidadeSeModuloSelecionadoForDiferente();

        const moduloId = modulo.id;
        this.funcionalidadeService.findFuncionalidadesByModulo(moduloId).subscribe((funcionalidades: Funcionalidade[]) => {
            this.funcionalidades = funcionalidades;
            this.selecionaFuncionalidadeFromCurrentAnalise();
        });
        this.moduloSelectedEvent.emit(modulo);
    }

    private deselecionaFuncionalidadeSeModuloSelecionadoForDiferente() {
        if (this.moduloSelecionado.id !== this.oldModuloSelectedId) {
            this.funcionalidadeSelecionada = undefined;
        }
    }

    adicionarModulo() {
        if (!this.novoModulo.nome) {
            this.pageNotificationService.addErrorMsg(this.getLabel('Global.Mensagens.FavorPreencherCampoObrigatorio'));
            return;
        }
        const sistemaId = this.sistema.id;
        // TODO inserir um spinner, talvez bloquear a UI
        this.moduloService.create(this.novoModulo, sistemaId).subscribe((moduloCriado: Modulo) => {
            this.estadoinicial();
            this.sistemaService.find(sistemaId).subscribe((sistemaRecarregado: Sistema) => {
                this.recarregarSistema(sistemaRecarregado);
                this.selecionarModulo(moduloCriado.id);
                this.criarMensagemDeSucessoDaCriacaoDoModulo(moduloCriado.nome, sistemaRecarregado.nome);
            });
        });

        this.fecharDialogModulo();
    }

    private recarregarSistema(sistemaRecarregado: Sistema) {
        this.analiseSharedDataService.analise.sistema = sistemaRecarregado;
        this.modulos = sistemaRecarregado.modulos;
    }

    private criarMensagemDeSucessoDaCriacaoDoModulo(nomeModulo: string, nomeSistema: string) {
        this.pageNotificationService
            .addSuccessMsg(`${this.getLabel('Cadastros.Modulo.Mensagens.msgModulo')} ${nomeModulo} ${this.getLabel('Cadastros.Modulo.Mensagens.msgCriadoParaSistema')} ${nomeSistema}`);
    }

    funcionalidadeDropdownPlaceholder() {
        if (this.isModuloSelected()) {
            return this.funcionalidadeDropdownPlaceHolderComModuloSelecionado();
        } else {
            return this.getLabel('Analise.Analise.Mensagens.msgSelecioneModuloCarregarFuncionalidades');
        }
    }

    private funcionalidadeDropdownPlaceHolderComModuloSelecionado(): string {
        if (this.moduloSelecionadoTemFuncionalidade()) {
            return this.getLabel('Analise.Analise.Mensagens.msgSelecioneFuncionalidade');
        } else {
            return this.getLabel('Analise.Analise.Mensagens.msgNenhumaFuncionalidadeCadastrado');
        }
    }

    private moduloSelecionadoTemFuncionalidade(): boolean {
        return this.moduloSelecionado.funcionalidades && this.moduloSelecionado.funcionalidades.length > 0;
    }

    abrirDialogFuncionalidade() {
        if (this.isModuloSelected()) {
            this.mostrarDialogFuncionalidade = true;
            this.novaFuncionalidade = new Funcionalidade();
        }
    }

    fecharDialogFuncionalidade() {
        this.mostrarDialogFuncionalidade = false;
    }

    adicionarFuncionalidade() {
        if (this.novaFuncionalidade.nome === undefined) {
            this.pageNotificationService.addErrorMsg(this.getLabel('Global.Mensagens.FavorPreencherCampoObrigatorio'));
            return;
        }
        const moduloId = this.moduloSelecionado.id;
        const sistemaId = this.sistema.id;
        // TODO inserir um spinner
        this.funcionalidadeService.create(this.novaFuncionalidade, moduloId)
            .subscribe((funcionalidadeCriada: Funcionalidade) => {
                this.sistemaService.find(sistemaId).subscribe((sistemaRecarregado: Sistema) => {
                    this.recarregarSistema(sistemaRecarregado);
                    this.selecionarModulo(moduloId);
                    this.selecionarFuncionalidadeRecemCriada(funcionalidadeCriada);
                    this.criarMensagemDeSucessoDaCriacaoDaFuncionalidade(funcionalidadeCriada.nome,
                        this.moduloSelecionado.nome, sistemaRecarregado.nome);
                });
            });

        this.fecharDialogFuncionalidade();
    }

    funcionalidadeSelected(funcionalidade: Funcionalidade) {
        if (funcionalidade.modulo === undefined || funcionalidade == null) {
            this.moduloService.findByFuncionalidade(funcionalidade.id).subscribe(
                modulo => {
                    funcionalidade.modulo = modulo;
                    this.funcionalidadeSelectedEvent.emit(funcionalidade);
                }
            );
        } else { this.funcionalidadeSelectedEvent.emit(funcionalidade); }
    }

    private selecionarFuncionalidadeRecemCriada(funcionalidadeCriada: Funcionalidade) {
        this.funcionalidadeSelecionada = _.find(this.moduloSelecionado.funcionalidades,
            { 'id': funcionalidadeCriada.id });
        this.funcionalidadeSelected(this.funcionalidadeSelecionada);
    }

    private criarMensagemDeSucessoDaCriacaoDaFuncionalidade(nomeFunc: string, nomeModulo: string, nomeSistema: string) {
        this.pageNotificationService
            .addSuccessMsg(`${this.getLabel('Analise.Analise.Mensagens.msgSubmodulo')} ${nomeFunc} ${this.getLabel('Analise.Analise.Mensagens.msgCriadoNoModulo')} ${nomeModulo} ${this.getLabel('Analise.Analise.Mensagens.msgDoSistema')} ${nomeSistema}`);
    }

    ngOnDestroy() {
        this.subscriptionSistemaSelecionado.unsubscribe();
        this.subscriptionAnaliseCarregada.unsubscribe();
        this.subscriptionAnaliseSalva.unsubscribe();
        this.subscriptionFuncaoAnaliseCarregada.unsubscribe();
        this.changeDetectorRef.detach();
    }

}