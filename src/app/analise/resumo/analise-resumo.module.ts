import { FieldsetModule } from 'primeng/fieldset';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { FormsModule } from '@angular/forms';

import {
  ButtonModule,
  InputTextModule,
  SpinnerModule,
  CalendarModule,
  DropdownModule,
  RadioButtonModule,
  ConfirmDialogModule,
  DataTableModule,
  ConfirmationService,
  TabViewModule,
  InputTextareaModule,
  DialogModule
} from 'primeng/primeng';

import { AbacoSharedModule } from '../../shared/abaco-shared.module';
import { AbacoAnaliseSharedModule } from '../../analise-shared/analise-shared.module';

import { AnaliseResumoComponent } from './analise-resumo.component';

import { MemoryDataTableModule } from '../../memory-datatable/memory-datatable.module';

import { HttpClient } from '@angular/common/http';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, './assets/i18n/', '.json');
  }


@NgModule({
  imports: [
    CommonModule,
    HttpModule,
    FormsModule,
    ButtonModule,
    SpinnerModule,
    CalendarModule,
    DropdownModule,
    RadioButtonModule,
    InputTextModule,
    DataTableModule,
    ConfirmDialogModule,
    TabViewModule,
    InputTextareaModule,
    AbacoSharedModule,
    DialogModule,
    AbacoAnaliseSharedModule,
    MemoryDataTableModule,
    FieldsetModule,
    TranslateModule.forChild({
      loader: {
        provide: TranslateLoader,
        useFactory: (createTranslateLoader),
        deps: [HttpClient]
      }
    })
  ],
  declarations: [
    AnaliseResumoComponent
  ],
  exports: [
    AnaliseResumoComponent
  ]
})
export class AbacoAnaliseResumoModule { }
