import { Component, HostListener, Inject } from '@angular/core';
import { MessageService, PrimeNGConfig } from 'primeng/api';
import { StorageService } from './services/storage.service';
import { UserServiceService } from './services/user-service.service';
import { Store } from '@ngrx/store';
import { State, getShowPopupMessage } from './state/app.reducer';
import * as AppActions from './state/app.actions';
@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  providers: [MessageService],
})
export class AppComponent {
  isLoggedIn = false;
  showAdminBoard = false;
  showModeratorBoard = false;
  username?: string;

  constructor(
    private primengConfig: PrimeNGConfig,
    private storageService: StorageService,
    private userService: UserServiceService,
    private messageService: MessageService,
    private store: Store<State>
  ) {}

  ngOnInit() {
    this.primengConfig.ripple = true;
    this.isLoggedIn = this.storageService.isLoggedIn();

    if (this.isLoggedIn) {
      const user = this.storageService.getUser();

      this.username = user.username;
    }

    this.store
      .select(getShowPopupMessage)
      .subscribe(({ showPopupMessage, popupMessage }) => {
        if (showPopupMessage && popupMessage) {
          this.showInfo(popupMessage);
          this.store.dispatch(
            AppActions.setShowPopupMessage({
              showPopupMessage: false,
              popupMessage: null,
            })
          );
        }
      });
  }

  showInfo(msg) {
    this.messageService.add({
      severity: 'info',
      summary: 'Success',
      detail: msg,
    });
  }

  logout(): void {
    this.userService.logout().subscribe({
      next: (res) => {
        console.log(res);
        this.storageService.clean();
      },
      error: (err) => {
        console.log(err);
      },
    });

    window.location.reload();
  }

  @HostListener('window:beforeunload', ['$event'])
  beforeUnloadHandler($event: any): void {
    this.userService.setlastTimeCourseMapperOpened().subscribe();
  }
}
