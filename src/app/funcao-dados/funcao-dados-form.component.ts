import { Component, OnInit, Input } from '@angular/core';
import { AnaliseSharedDataService, PageNotificationService } from '../shared';
import { FuncaoDados } from './funcao-dados.model';
import { Analise } from '../analise';
import { FatorAjuste } from '../fator-ajuste';

import * as _ from 'lodash';
import { Modulo } from '../modulo/index';
import { Funcionalidade } from '../funcionalidade/index';
import { SelectItem } from 'primeng/primeng';
import { Calculadora } from '../analise-shared/calculadora';
import { DatatableClickEvent } from '@basis/angular-components';
import { ConfirmationService } from 'primeng/primeng';
import { ResumoFuncoes } from '../analise-shared/resumo-funcoes';
import { AfterViewInit, AfterContentInit } from '@angular/core/src/metadata/lifecycle_hooks';

@Component({
  selector: 'app-analise-funcao-dados',
  templateUrl: './funcao-dados-form.component.html'
})
export class FuncaoDadosFormComponent implements OnInit, AfterContentInit {

  funcaoDadosEmEdicao: FuncaoDados;
  resumo: ResumoFuncoes;

  fatoresAjuste: FatorAjuste[] = [];

  // FIXME considerar o enum
  classificacoes: SelectItem[] = [
    { label: 'ALI', value: 'ALI' },
    { label: 'AIE', value: 'AIE' }
  ];

  constructor(
    private analiseSharedDataService: AnaliseSharedDataService,
    private confirmationService: ConfirmationService,
    private pageNotificationService: PageNotificationService
  ) { }

  ngOnInit() {
    this.currentFuncaoDados = new FuncaoDados();

    this.analiseSharedDataService.getLoadSubject().subscribe(() => {
      this.resumo = this.analise.resumoFuncaoDados;
    });
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

  private set analise(analise: Analise) {
    this.analiseSharedDataService.analise = analise;
  }

  private get manual() {
    if (this.analiseSharedDataService.analise.contrato) {
      return this.analiseSharedDataService.analise.contrato.manual;
    }
    return undefined;
  }

  isContratoSelected(): boolean {
    // FIXME p-dropdown requer 2 clicks quando o [options] chama um método get()
    const isContratoSelected = this.analiseSharedDataService.isContratoSelected();
    if (isContratoSelected && this.fatoresAjuste.length === 0) {
      this.fatoresAjuste = this.manual.fatoresAjuste;
    }

    return isContratoSelected;
  }

  fatoresAjusteDropdownPlaceholder() {
    if (this.isContratoSelected()) {
      return 'Valor de Ajuste';
    } else {
      return `Valor de Ajuste - Selecione um Contrato na aba 'Geral' para carregar os Valores de Ajuste`;
    }
  }

  moduloSelected(modulo: Modulo) {
  }

  funcionalidadeSelected(funcionalidade: Funcionalidade) {
    this.currentFuncaoDados.funcionalidade = funcionalidade;
  }

  isFuncionalidadeSelected(): boolean {
    return !_.isUndefined(this.currentFuncaoDados.funcionalidade);
  }

  deveHabilitarBotaoAdicionar(): boolean {
    // TODO complementar com outras validacoes
    return this.isFuncionalidadeSelected() && !_.isUndefined(this.analise.tipoContagem);
  }

  adicionar() {
    if (this.deveHabilitarBotaoAdicionar()) {
      this.doAdicionar();
    }
  }

  private doAdicionar() {
    const funcaoDadosCalculada = Calculadora.calcular(this.analise.tipoContagem, this.currentFuncaoDados);
    this.analise.addFuncaoDados(funcaoDadosCalculada);
    this.resumo = this.analise.resumoFuncaoDados;
    this.pageNotificationService.addCreateMsgWithName(funcaoDadosCalculada.name);
    // Mantendo o mesmo conteudo a pedido do Leandro
    this.currentFuncaoDados = this.currentFuncaoDados.clone();
    this.currentFuncaoDados.artificialId = undefined;
  }

  datatableClick(event: DatatableClickEvent) {
    if (!event.selection) {
      return;
    }

    const funcaoDadosSelecionada: FuncaoDados = event.selection;
    switch (event.button) {
      case 'edit':
        console.log('edit');
        break;
      case 'delete':
        this.funcaoDadosEmEdicao = funcaoDadosSelecionada;
        this.confirmDelete();
    }
  }

  confirmDelete() {
    const name: string = this.funcaoDadosEmEdicao.name;
    this.confirmationService.confirm({
      message: `Tem certeza que deseja excluir a Função de Dados '${name}'?`,
      accept: () => {
        this.analise.deleteFuncaoDados(this.funcaoDadosEmEdicao);
        this.pageNotificationService.addDeleteMsgWithName(name);
      }
    });
  }

}
