import { TranslateService } from '@ngx-translate/core';
import { MessageUtil } from './../util/message.util';
import { ExportacaoUtil } from './../util/exportacao.util';
import { ExportacaoUtilService } from '../util/service/exportacao-util.service';
import { Component, OnInit, EventEmitter, Input } from '@angular/core';
import { MenuItem, DataTable } from 'primeng/primeng';
import { HttpService } from '@basis/angular-components';
import { environment } from '../../environments/environment';
import { NgBlockUI, BlockUI } from 'ng-block-ui';
import { PageNotificationService } from '@basis/angular-components';
import { PanelMenuModule } from 'primeng/components/panelmenu/panelmenu';
import { ElasticQuery } from '../shared/elastic-query';
import { ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
    selector: 'app-botoes-exportacao',
    templateUrl: 'botoes-exportacao.component.html'
})


export class BotoesExportacaoComponent implements OnInit {
    @Input() resourceName: string;
    @Input() fileName: string;
    @Input() query: string;
    @BlockUI() blockUI: NgBlockUI;

    tiposExportacao: MenuItem[] = [];

    ngOnInit() {
        this.getTiposExportacao();
    }

    constructor(
        private http: HttpService,
        private pageNotificationService: PageNotificationService,
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


    getTiposExportacao() {
        this.tiposExportacao = [
            {
                label: 'PDF', icon: '', command: () => {
                    this.exportar(ExportacaoUtilService.PDF);
                }
            },
            {
                label: 'EXCEL', icon: '', command: () => {
                    this.exportar(ExportacaoUtilService.EXCEL);
                }
            },
            {
                label: 'IMPRIMIR', icon: '', command: () => {
                    this.imprimir(ExportacaoUtilService.PDF);
                }
            },
        ];
    }

    exportar(tipoRelatorio: string) {

        ExportacaoUtilService.exportarRelatorio(tipoRelatorio, environment.apiUrl + '/' + this.resourceName, this.http, this.query).subscribe(
            downloadUrl => {
                ExportacaoUtil.download(downloadUrl,
                    this.fileName + ExportacaoUtilService.getExtension(tipoRelatorio));
                this.blockUI.stop();
            },
            err => {
                this.addErrorMessage(false);
            }
        );
    }

    imprimir(tipoRelatorio: string) {
        ExportacaoUtilService.exportarRelatorio(tipoRelatorio, environment.apiUrl + '/' + this.resourceName, this.http, this.query).subscribe(
            downloadUrl => {
                ExportacaoUtil.imprimir(downloadUrl);
                this.blockUI.stop();
            },
            err => {
                // this.toastrService.error(MessageUtil.ERRO_IMPRIMIR_ARQUIVO);
                // this.blockUI.stop();
                this.addErrorMessage(true);
            }
        );
    }

    //   private addGenerateMessage(isImprimir: boolean) {
    //     if (isImprimir)
    //         this.pageNotificationService.addCreateMsg('Exportando pesquisa!');
    //     else
    //         this.pageNotificationService.addCreateMsg('Imprimindo pesquisa!');
    //   }
    private addErrorMessage(isImprimir: boolean) {
        if (isImprimir)
            this.pageNotificationService.addErrorMessage(this.getLabel('Global.Mensagens.ErroImprimirPesquisa'));
        else
            this.pageNotificationService.addErrorMessage(this.getLabel('Global.Mensagens.ErroExportarpesquisa'));
    }
}

export class PanelMenuDemo {

    items: MenuItem[];

    ngOnInit() {
        this.items = [
            {
                label: 'File',
                icon: 'fa-file-o',
                items: [{
                    label: 'New',
                    icon: 'fa-plus',
                    items: [
                        { label: 'Project' },
                        { label: 'Other' },
                    ]
                },
                { label: 'Open' },
                { label: 'Quit' }
                ]
            },
            {
                label: 'Edit',
                icon: 'fa-edit',
                items: [
                    { label: 'Undo', icon: 'fa-mail-forward' },
                    { label: 'Redo', icon: 'fa-mail-reply' }
                ]
            },
            {
                label: 'Help',
                icon: 'fa-question',
                items: [
                    {
                        label: 'Contents'
                    },
                    {
                        label: 'Search',
                        icon: 'fa-search',
                        items: [
                            {
                                label: 'Text',
                                items: [
                                    {
                                        label: 'Workspace'
                                    }
                                ]
                            },
                            {
                                label: 'File'
                            }
                        ]
                    }
                ]
            },
            {
                label: 'Actions',
                icon: 'fa-gear',
                items: [
                    {
                        label: 'Edit',
                        icon: 'fa-refresh',
                        items: [
                            { label: 'Save', icon: 'fa-save' },
                            { label: 'Update', icon: 'fa-save' },
                        ]
                    },
                    {
                        label: 'Other',
                        icon: 'fa-phone',
                        items: [
                            { label: 'Delete', icon: 'fa-minus' }
                        ]
                    }
                ]
            }
        ];
    }
}