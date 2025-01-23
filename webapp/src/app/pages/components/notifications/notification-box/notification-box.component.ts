import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable, map } from 'rxjs';
import { NotificationsService } from 'src/app/services/notifications.service';
import { Notification } from 'src/app/models/Notification';
import { MenuItem } from 'primeng/api';
import { Store } from '@ngrx/store';
import {
  State,
  getBlockingUsers,
  getSearchedTerm,
} from '../state/notifications.reducer';
import * as NotificationActions from '../state/notifications.actions';

@Component({
  selector: 'app-notification-box',
  templateUrl: './notification-box.component.html',
  styleUrls: ['./notification-box.component.css'],
})
export class NotificationBoxComponent {
  @Input() notification: Notification;
  @Output() notificationClicked = new EventEmitter<Notification>();
  readNotificationMenuOptions: MenuItem;
  unreadNotificationMenuOptions: MenuItem;
  defaultNotificationMenuOptions: MenuItem;
  searchTerm: Observable<string>;
  UnblockUserNotificationMenuOptions: {
    label: string;
    icon: string;
    command: ($event: any) => void;
  };
  BlockUserNotificationMenuOptions: {
    label: string;
    icon: string;
    command: ($event: any) => void;
  };

  /*  $notificationList: Observable<Notification[]> | undefined; */
  constructor(
    private notificationService: NotificationsService,
    protected store: Store<State>
  ) {}

  ngOnInit(): void {
    /* this.$notificationList = this.notificationService.$notifications; */

   
    this.defaultNotificationMenuOptions = {
      label: 'Delete',
      icon: 'pi pi-times',
      command: ($event) => {
        $event.originalEvent.stopPropagation();

        this.store.dispatch(
          NotificationActions.notificationsRemoved({
            notifications: [this.notification],
          })
        );
      },
    };

    this.readNotificationMenuOptions = {
      label: 'Mark as read',
      icon: 'pi pi-check',
      command: ($event) => {
        $event.originalEvent.stopPropagation();

        this.store.dispatch(
          NotificationActions.notificationsMarkedAsRead({
            notifications: [this.notification._id],
          })
        );
      },
    };

    this.unreadNotificationMenuOptions = {
      label: 'Mark as unread',
      icon: 'pi pi-check',
      command: ($event) => {
        $event.originalEvent.stopPropagation();

        this.store.dispatch(
          NotificationActions.notificationsMarkedAsUnread({
            notifications: [this.notification._id],
          })
        );
      },
    };

    this.UnblockUserNotificationMenuOptions = {
      label: `Unblock ${this.notification.username}`,
      icon: 'pi pi-times',
      command: ($event) => {
        $event.originalEvent.stopPropagation();

        this.store.dispatch(
          NotificationActions.unblockUser({
            userId: this.notification.authorId,
          })
        );
      },
    };

    this.BlockUserNotificationMenuOptions = {
      label: `Block ${this.notification.username}`,
      icon: 'pi pi-ban',
      command: ($event) => {
        $event.originalEvent.stopPropagation();

        this.store.dispatch(
          NotificationActions.blockUser({
            userId: this.notification.authorId,
          })
        );
      },
    };

    this.searchTerm = this.store.select(getSearchedTerm);
  }

  get menuOptions$(): Observable<any[]> {
    return this.store.select(getBlockingUsers).pipe(
      map((blockingUsers) => {
        let readOrUnreadMenuOption = this.notification.isRead
          ? this.unreadNotificationMenuOptions
          : this.readNotificationMenuOptions;

        if (
          blockingUsers.some((user) => user._id === this.notification.authorId)
        ) {
          return [
            readOrUnreadMenuOption,
            this.defaultNotificationMenuOptions,
            this.UnblockUserNotificationMenuOptions,
          ];
        }

        return [
          readOrUnreadMenuOption,
          this.defaultNotificationMenuOptions,
          this.BlockUserNotificationMenuOptions,
        ];
      })
    );
  }

  toggleMenuOptions($event, menu) {
    menu.toggle($event);
    $event.stopPropagation();
  }

  onNotificationClicked() {
    this.notificationClicked.emit();
  }

  onStarNotification($event) {
    $event.stopPropagation();

    this.store.dispatch(
      NotificationActions.starNotifications({
        notifications: [this.notification._id],
      })
    );
  }

  onUnstarNotification($event) {
    $event.stopPropagation();
    this.store.dispatch(
      NotificationActions.unstarNotifications({
        notifications: [this.notification._id],
      })
    );
  }
}
