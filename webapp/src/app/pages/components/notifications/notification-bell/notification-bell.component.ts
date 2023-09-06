import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { NotificationsService } from 'src/app/services/notifications.service';
import { State } from '../state/notifications.reducer';
import * as NotificationActions from '../state/notifications.actions';
import { getAllNotificationsNumUnread } from '../state/notifications.reducer';
import { Observable } from 'rxjs';
//TODO: put this component behind an Auth guard
@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css'],
})
export class NotificationBellComponent {
  constructor(
    private notificationsService: NotificationsService,
    private store: Store<State>
  ) {}

  totalNumUnreadNotifications$: Observable<number>;

  //TODO Move the loadNotifications dispatch action and the initialiseSocketConnection method to the app.component.ts or somewhere else.
  ngOnInit(): void {
    /* console.log('Notification bell component initialized'); */
    console.log('Fetching notifications');
    /*   this.notificationsService.initialiseSocketConnection();
    this.notificationsService.fetchNotifications(); */
    this.store.dispatch(NotificationActions.loadNotifications());
    this.notificationsService.initialiseSocketConnection();
    this.totalNumUnreadNotifications$ = this.store.select(
      getAllNotificationsNumUnread
    );
  }

  isPanelOpen: boolean = false;

  toggleNotificationPanel($event: any, notificationPanel: any) {
    console.log('Toggling notification panel');
    notificationPanel.show($event);
  }
}
