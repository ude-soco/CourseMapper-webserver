import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationsService } from 'src/app/services/notifications.service';
import { Notification } from 'src/app/models/Notification';
import { MenuItem } from 'primeng/api';
import { Store } from '@ngrx/store';
import { State } from '../state/notifications.reducer';
import * as NotificationActions from '../state/notifications.actions';

@Component({
  selector: 'app-notification-box',
  templateUrl: './notification-box.component.html',
  styleUrls: ['./notification-box.component.css'],
})
export class NotificationBoxComponent {
  @Input() notification;
  @Output() notificationClicked = new EventEmitter<Notification>();
  readNotificationMenuOptions: MenuItem[];
  unreadNotificationMenuOptions: MenuItem[];
  defaultNotificationMenuOptions: MenuItem[];

  /*  $notificationList: Observable<Notification[]> | undefined; */
  constructor(
    private notificationService: NotificationsService,
    protected store: Store<State>
  ) {}

  ngOnInit(): void {
    /* this.$notificationList = this.notificationService.$notifications; */
    this.defaultNotificationMenuOptions = [
      {
        label: 'Remove',
        icon: 'pi pi-times',
        command: ($event) => {
          $event.originalEvent.stopPropagation();
          console.log('Delete clicked');
          this.store.dispatch(
            NotificationActions.notificationsRemoved({
              notifications: [this.notification._id],
            })
          );
        },
      },
    ];

    this.readNotificationMenuOptions = [
      {
        label: 'Mark as read',
        icon: 'pi pi-check',
        command: ($event) => {
          $event.originalEvent.stopPropagation();
          console.log('Mark all as read clicked');
          this.store.dispatch(
            NotificationActions.notificationsMarkedAsRead({
              notifications: [this.notification._id],
            })
          );
        },
      },

      ...this.defaultNotificationMenuOptions,
    ];

    this.unreadNotificationMenuOptions = [
      {
        label: 'Mark as unread',
        icon: 'pi pi-times',
        command: ($event) => {
          $event.originalEvent.stopPropagation();
          console.log('Mark as unread clicked');
          this.store.dispatch(
            NotificationActions.notificationsMarkedAsUnread({
              notifications: [this.notification._id],
            })
          );
        },
      },

      ...this.defaultNotificationMenuOptions,
    ];
  }

  get menuOptions() {
    if (this.notification.isRead) {
      return this.unreadNotificationMenuOptions;
    } else {
      return this.readNotificationMenuOptions;
    }
  }

  toggleMenuOptions($event, menu) {
    menu.toggle($event);
    $event.originalEvent.stopPropagation();
  }

  onNotificationClicked() {
    console.log('notification clicked!');
    this.notificationClicked.emit();
  }

  onStarNotification($event) {
    $event.stopPropagation();
    console.log('star clicked!');
  }

  onUnstarNotification($event) {
    $event.stopPropagation();
    console.log('unstar clicked!');
  }
}
