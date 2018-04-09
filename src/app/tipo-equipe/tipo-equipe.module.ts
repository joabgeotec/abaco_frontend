import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatatableModule } from '@basis/angular-components';
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
    MultiSelectModule
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
