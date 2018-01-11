import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatatableModule } from '@basis/angular-components';
import { MemoryDataTableModule } from '../memory-datatable/memory-datatable.module';

import {
  ButtonModule,
  InputTextModule,
  SpinnerModule,
  CalendarModule,
  DropdownModule,
  RadioButtonModule,
  DialogModule,
  ConfirmDialogModule,
  ConfirmationService
} from 'primeng/primeng';

import {
  ManualService,
  ManualComponent,
  ManualDetailComponent,
  ManualFormComponent,
  manualRoute
} from './';

import { EsforcoFaseService } from '../esforco-fase/esforco-fase.service';

@NgModule({
  imports: [
    CommonModule,
    HttpModule,
    FormsModule,
    RouterModule.forRoot(manualRoute, { useHash: true }),
    DatatableModule,
    ButtonModule,
    SpinnerModule,
    CalendarModule,
    DropdownModule,
    RadioButtonModule,
    InputTextModule,
    DialogModule,
    ConfirmDialogModule,
    MemoryDataTableModule
  ],
  declarations: [
    ManualComponent,
    ManualDetailComponent,
    ManualFormComponent
  ],
  providers: [
    ManualService,
    ConfirmationService,
    EsforcoFaseService
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class AbacoManualModule {}
