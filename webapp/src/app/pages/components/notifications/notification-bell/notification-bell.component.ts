import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { NotificationsService } from 'src/app/services/notifications.service';
import { State } from '../state/notifications.reducer';
import * as NotificationActions from '../state/notifications.actions';

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

  ngOnInit(): void {
    /* console.log('Notification bell component initialized'); */
    console.log('Fetching notifications');
    /*   this.notificationsService.initialiseSocketConnection();
    this.notificationsService.fetchNotifications(); */
    this.store.dispatch(NotificationActions.loadNotifications());
  }

  isPanelOpen: boolean = false;

  toggleNotificationPanel($event: any, notificationPanel: any) {
    console.log('Toggling notification panel');
    notificationPanel.show($event);
  }
}
