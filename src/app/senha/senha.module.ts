import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpModule } from '@angular/http';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpService, SecurityModule, AuthService } from '@basis/angular-components';
import {
    ButtonModule,
    InputTextModule,
    SpinnerModule,
    CalendarModule,
    DropdownModule,
    RadioButtonModule,
    ConfirmDialogModule,
    ConfirmationService,
    PasswordModule
} from 'primeng/primeng';

import { SenhaComponent, SenhaFormComponent, senhaRoute, SenhaService } from './';

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
        RouterModule.forRoot(senhaRoute, { useHash: true }),
        ButtonModule,
        ButtonModule,
        SpinnerModule,
        CalendarModule,
        DropdownModule,
        RadioButtonModule,
        InputTextModule,
        ConfirmDialogModule,
        PasswordModule,
        SecurityModule.forRoot(),
        TranslateModule.forChild({
            loader: {
              provide: TranslateLoader,
              useFactory: (createTranslateLoader),
              deps: [HttpClient]
            }
          })
    ],
    declarations: [
        SenhaFormComponent,
        SenhaComponent
    ],
    providers: [
        SenhaService
    ],
    schemas: [CUSTOM_ELEMENTS_SCHEMA]
})

export class SenhaModule {

}
