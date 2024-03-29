import { TranslateService } from '@ngx-translate/core';
import { Component, OnInit, OnDestroy, NgZone} from '@angular/core';
import { Response } from '@angular/http';
import { LoginService } from './login.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable, Subscription } from 'rxjs/Rx';
import { AuthService, HttpService } from '@basis/angular-components';
import { environment } from '../../environments/environment';
import { User } from '../user';
import { PageNotificationService } from '../shared/page-notification.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {

  username: string;
  password: string;

  authenticated = false;

  private routeSub: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private loginService: LoginService,
    private authService: AuthService<User>,
    private http: HttpService,
    private zone: NgZone,
    private pageNotificationService: PageNotificationService,
    private translate: TranslateService
  ) { }

  getLabel(label) {
    let str: any;
    this.translate.get(label).subscribe((res: string) => {
      str = res;
    }).unsubscribe();
    return str;
  }

  ngOnInit() {
    this.authenticated = this.authService.isAuthenticated();
  }

  ngOnDestroy() {
  }

  login() {

    if (!this.username || !this.password) {
      this.pageNotificationService.addErrorMsg(this.getLabel('Global.Mensagens.FavorPreencherCamposObrigatorios'));
      return;
    }

    if (this.password.length < 4) {
      this.pageNotificationService.addErrorMsg(this.getLabel('Login.Mensagens.msgASenhaPrecisaTerNoMinimo4Caracteres'));
      return;
    }

    this.loginService.login(this.username, this.password).subscribe(() => {
      // this.authService.loginSuccess();

      // FIXME Bypassando o componente para funcionar com o firefox
      this.getUserDetails().subscribe(response => {
        const storageKey = environment.auth.userStorageIndex;
        environment.auth.userStorage[`${storageKey}`] = JSON.stringify(response);
        this.zone.runOutsideAngular(() => {
          location.reload();
        });
      });
    }, error => {
      switch (error.status) {
        case 401: {
          this.pageNotificationService.addErrorMsg(this.getLabel('Login.Mensagens.msgUsuarioOuSenhaInvalidos'));
        } break;
        case 400: {
          this.pageNotificationService.addErrorMsg(this.getLabel('Login.Mensagens.msgUsuarioOuSenhaInvalidos'));
        } break;
      }
    });
  }

  protected getUserDetails(): Observable<any> {
    return this.http.get(`${environment.auth.detailsUrl}`).map((response: Response) => {
      return response.json();
    });
  }

  authenticatedUserFullName(): string {
    const storageUser = this.authService.getUser();
    if (!storageUser) {
      return;
    }
    return storageUser.firstName + ' ' + storageUser.lastName;
  }

  private sleepFor(sleepDuration) {
    const now = new Date().getTime();
    while (new Date().getTime() < now + sleepDuration) { /* do nothing */ }
  }

}
