import { Component, OnInit } from '@angular/core';
import {
  NotificationItem,
  Notification,
} from 'src/app/model/notification-item';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-notification-setting',
  templateUrl: './notification-setting.component.html',
  styleUrls: ['./notification-setting.component.css'],
})
export class NotificationSettingComponent implements OnInit {
  notificationItems: Notification[] = [];
  contextMenuOpened!: boolean;
  isSubscriptionsOpened: boolean;
  constructor(private notificationService: NotificationServiceService) {
    this.contextMenuOpened = false;
    this.notificationService.allNotificationItems$.subscribe((items) => {
      this.notificationItems = items;
    });
    this.notificationService.clickedMarkAllAsRead$.subscribe(() => {
      this.notificationItems.forEach((item) => {
        item.read = true;
      });
    });
  }

  ngOnInit(): void {}
  openContextMenu(event: any, op: any) {
    if (!this.contextMenuOpened) {
      op.show(event);
      this.contextMenuOpened = true;
    } else {
      op.hide(event);
      this.contextMenuOpened = false;
    }
  }

  closeMenu(op: any) {
    console.log('top menu');
    op.hide();
  }

  openSubscriptions() {
    console.log('open sub');
    this.isSubscriptionsOpened = true;
  }
  handleCloseSubscription() {
    this.isSubscriptionsOpened = false;
  }
}
