import { TranslateService } from '@ngx-translate/core';
import { Component, Input, ChangeDetectionStrategy, ChangeDetectorRef, OnDestroy } from '@angular/core';

import { Analise, AnaliseService } from '../../analise';
import { ResponseWrapper, AnaliseSharedDataService, PageNotificationService } from '../../shared';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import * as _ from 'lodash';
import { Router } from '@angular/router';

@Component({
  selector: 'app-analise-botao-salvar',
  templateUrl: './analise-botao-salvar-component.html'
})
export class AnaliseBotaoSalvarComponent implements OnDestroy {

  motivosBotaoDesabilitado: Set<string> = new Set<string>();

  private saveSubscription: Subscription;
  private updateSubscription: Subscription;

  constructor(
    private analiseService: AnaliseService,
    private analiseSharedDataService: AnaliseSharedDataService,
    private pageNotificationService: PageNotificationService,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router,
    private translate: TranslateService
  ) { }

  getLabel(label) {
    let str: any;
    this.translate.get(label).subscribe((res: string) => {
        str = res;
    }).unsubscribe();
    return str;
  }

  habilitarBotaoSalvar(): boolean {
    const habilitar: boolean = this.checarSeDeveHabilitarBotaoEConstruirMotivos();
    this.changeDetectorRef.markForCheck();
    return habilitar;
  }

  private checarSeDeveHabilitarBotaoEConstruirMotivos(): boolean {
    this.motivosBotaoDesabilitado.clear();
    // TODO complementar. hoje é só uma prova de conceito
    if (_.isEmpty(this.analise.organizacao)) {
      this.motivosBotaoDesabilitado.add(this.getLabel('Analise.Analise.Mensagens.msgSelecioneOrganizacao'));
    }
    if (_.isEmpty(this.analise.equipeResponsavel)) {
      this.motivosBotaoDesabilitado.add(this.getLabel('Analise.Analise.Mensagens.msgSelecioneEquipeResponsavel'));
    }
    if (_.isEmpty(this.analise.sistema)) {
      this.motivosBotaoDesabilitado.add(this.getLabel('Analise.Analise.Mensagens.msgSelecioneSistema'));
    }
    return _.isEmpty(this.motivosBotaoDesabilitado);
  }

  private nenhumaFuncaoAdicionada() {
    const analise: Analise = this.analise;
    return _.isEmpty(analise.funcaoDados) && _.isEmpty(analise.funcaoTransacaos);
  }

  public motivosDesabilitar(): string {
    return _.join(Array.from(this.motivosBotaoDesabilitado), '\n');
  }

  private get analise(): Analise {
    return this.analiseSharedDataService.analise;
  }

  private set analise(analise: Analise) {
    this.analiseSharedDataService.analise = analise;
  }

  salvar() {
    this.doSalvar();
    this.analiseSharedDataService.analiseSalva();
  }

  // Sendo feito aqui, e não no AnaliseSharedDataService, para evitar problema com dependencias circulares
  private doSalvar() {
    if (this.analiseSharedDataService.isEdit) {
      this.editar();
    } else {
      this.cadastrar();
    }
  }

  private editar() {
    this.subscribeToUpdateResponse(this.analiseService.update(this.analise));
  }

  private subscribeToUpdateResponse(result: Observable<any>) {
    this.updateSubscription = result.subscribe((res: Analise) => {
      this.analise = res;
      this.pageNotificationService.addSuccessMsg(this.getLabel('Analise.Analise.Mensagens.msgAnaliseAtualizadaSucesso'));
    });
  }

  private cadastrar() {
    this.definirValorPadrao();
    this.subscribeToSaveResponse(this.analiseService.create(this.analise));
  }

  private subscribeToSaveResponse(result: Observable<any>) {
    this.saveSubscription = result.subscribe((res: Analise) => {
      this.analise = res;
      this.pageNotificationService.addSuccessMsg(this.getLabel('Analise.Analise.Mensagens.msgAnaliseSalvaSucesso'));

      this.router.navigate(['/analise', this.analise.id, 'edit']);
    });
  }

  ngOnDestroy() {
    this.changeDetectorRef.detach();
    this.unsubsribeIfSubscriptionExist(this.saveSubscription);
    this.unsubsribeIfSubscriptionExist(this.updateSubscription);
  }

  private unsubsribeIfSubscriptionExist(subscription: Subscription) {
    if (subscription) {
      subscription.unsubscribe();
    }
  }

  private definirValorPadrao() {
    this.analise.baselineImediatamente = false;
 }

}
