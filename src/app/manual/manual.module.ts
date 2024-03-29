import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatatableModule } from '@basis/angular-components';
import { MemoryDataTableModule } from '../memory-datatable/memory-datatable.module';
import { BotoesExportacaoModule } from './../botoes-exportacao/botoes-exportacao.module';
import {
  ButtonModule,
  InputTextModule,
  SpinnerModule,
  CalendarModule,
  DropdownModule,
  RadioButtonModule,
  DataTableModule,
  DialogModule,
  ConfirmDialogModule,
  ConfirmationService,
  FileUploadModule
} from 'primeng/primeng';

import {
  ManualService,
  ManualComponent,
  ManualDetailComponent,
  ManualFormComponent,
  manualRoute
} from './';

import { EsforcoFaseService } from '../esforco-fase/esforco-fase.service';
import { ActiveBooleanPipe } from '../shared/active-boolean.pipe';
import { AbacoButtonsModule } from '../abaco-buttons/abaco-buttons.module';
import {HttpClient} from '@angular/common/http';
import {TranslateModule, TranslateLoader} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    CommonModule,
    HttpModule,
    FormsModule,
    RouterModule.forRoot(manualRoute, { useHash: true }),
    DatatableModule,
    DataTableModule,
    ButtonModule,
    SpinnerModule,
    CalendarModule,
    DropdownModule,
    RadioButtonModule,
    InputTextModule,
    FileUploadModule,
    DialogModule,
    ConfirmDialogModule,
    MemoryDataTableModule,
    AbacoButtonsModule,
    BotoesExportacaoModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  declarations: [
    ManualComponent,
    ManualDetailComponent,
    ManualFormComponent,
    ActiveBooleanPipe,
  ],
  providers: [
    ManualService,
    ConfirmationService,
    EsforcoFaseService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AbacoManualModule {}
