import { Component, ElementRef, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { NotificationsService } from 'src/app/services/notifications.service';
import { State } from '../state/notifications.reducer';
import * as NotificationActions from '../state/notifications.actions';
import { getAllNotificationsNumUnread } from '../state/notifications.reducer';
import { Observable } from 'rxjs';
import { getShowNotificationsPanel } from 'src/app/state/app.reducer';
import { OverlayPanel } from 'primeng/overlaypanel';
import * as AppActions from 'src/app/state/app.actions';
import { StorageService } from 'src/app/services/storage.service';
import { Socket } from 'ngx-socket-io';
//TODO: put this component behind an Auth guard
@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css'],
})
export class NotificationBellComponent {
  constructor(
    private notificationsService: NotificationsService,
    private store: Store<State>,
    private storageService: StorageService,
    private socket: Socket,
  ) {}

  @ViewChild('notificationPanel') notificationPanel: OverlayPanel;
  totalNumUnreadNotifications$: Observable<number>;
  showNotificationsPanel$: Observable<boolean>;

  //TODO Move the loadNotifications dispatch action and the initialiseSocketConnection method to the app.component.ts or somewhere else.
  ngOnInit(): void { 
      const user = this.storageService.getUser();
    this.socket.emit("join", "user:"+user.id); 
    console.log("bill triggered")
    this.showNotificationsPanel$ = this.store.select(getShowNotificationsPanel);
    this.showNotificationsPanel$.subscribe((showNotificationsPanel) => {
      if (showNotificationsPanel === false && this.notificationPanel) {
        this.notificationPanel.hide();
      }
    });
 
    //const user = this.storageService.getUser();
    this.store.dispatch(NotificationActions.loadNotifications());
    
    //this.socket.emit("join", "course:"+course._id);
    this.notificationsService.initialiseSocketConnection();
    this.totalNumUnreadNotifications$ = this.store.select(
      getAllNotificationsNumUnread
    );
  }

  toggleNotificationPanel($event: any, notificationPanel: any) {
    notificationPanel.show($event);
    this.store.dispatch(
      AppActions.setShowNotificationsPanel({ showNotificationsPanel: true })
    );
  }
}
