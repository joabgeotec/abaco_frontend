import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BaselineService } from '../../baseline.service';
import { Subscription } from '../../../../../node_modules/rxjs/Rx';
import { DatatableComponent } from '@basis/angular-components';


@Component({
    selector: 'jhi-baseline-funcao-transacao',
    templateUrl: './baseline-funcao-transacao.component.html'
})
export class BaselineFuncaoTransacaoComponent implements OnInit, OnDestroy {

    private routeSub: Subscription;
    public idSistema: number;
    public idEquipe: number;
    public urlFt: String;

    rowsPerPageOptionsFT: number[] = [5, 10, 20];
    @ViewChild(DatatableComponent) datatable: DatatableComponent;

    constructor(
        private route: ActivatedRoute,
        private baselineService: BaselineService,
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

    ngOnDestroy(): void {
    }

    ngOnInit(): void {
        this.routeSub = this.route.params.subscribe(params => {
            this.idSistema = params['id'];
            this.idEquipe = params['equipe'];
        });
        this.urlFt = `${this.baselineService.analiticosFTUrl}${this.idSistema}/equipe/${this.idEquipe}`;
    }

}
