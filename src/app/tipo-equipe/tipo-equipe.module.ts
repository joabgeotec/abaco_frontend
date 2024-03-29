import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatatableModule } from '@basis/angular-components';
import { BotoesExportacaoModule } from './../botoes-exportacao/botoes-exportacao.module';
import {
  ButtonModule,
  InputTextModule,
  SpinnerModule,
  CalendarModule,
  DropdownModule,
  RadioButtonModule,
  ConfirmDialogModule,
  ConfirmationService,
  MultiSelectModule
} from 'primeng/primeng';

import {
  TipoEquipeService,
  TipoEquipeComponent,
  TipoEquipeDetailComponent,
  TipoEquipeFormComponent,
  tipoEquipeRoute
} from './';

import { AbacoButtonsModule } from '../abaco-buttons/abaco-buttons.module';

import { HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

export function createTranslateLoader(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  imports: [
    CommonModule,
    HttpModule,
    FormsModule,
    RouterModule.forRoot(tipoEquipeRoute, { useHash: true }),
    DatatableModule,
    ButtonModule,
    SpinnerModule,
    CalendarModule,
    DropdownModule,
    RadioButtonModule,
    InputTextModule,
    ConfirmDialogModule,
    AbacoButtonsModule,
    MultiSelectModule,
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
    TipoEquipeComponent,
    TipoEquipeDetailComponent,
    TipoEquipeFormComponent
  ],
  providers: [
    TipoEquipeService,
    ConfirmationService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AbacoTipoEquipeModule {}
