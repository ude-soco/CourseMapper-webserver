import { Component, OnInit } from '@angular/core';
import { Notification } from 'src/app/model/notification-item';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-all-notification',
  templateUrl: './all-notification.component.html',
  styleUrls: ['./all-notification.component.css'],
})
export class AllNotificationComponent implements OnInit {
  notificationItems: Notification[] = [];
  temp: any;
  contextMenuOpened!: boolean;

  constructor(private notificationService: NotificationServiceService) {
    this.notificationService.allNotificationItems$.subscribe((items) => {
      this.notificationItems = items;
    });

    this.notificationService.getAllNotifications().subscribe((items) => {
      this.temp = items;
      this.notificationItems = this.temp.notificationLists;
    });
    this.notificationService.clickedMarkAllAsRead$.subscribe(() => {
      this.notificationItems.forEach((item) => {
        item.read = true;
      });
    });
    this.notificationService.clickedRemoveAll$.subscribe(() => {
      this.notificationItems = [];
    });
  }

  ngOnInit(): void {}

  openTopContextMenu(event: any, op: any) {
    if (!this.contextMenuOpened) {
      op.show(event);
      this.contextMenuOpened = true;
    } else {
      op.hide(event);
      this.contextMenuOpened = false;
    }
  }

  closeMenu(op: any) {
    op.hide();
    this.contextMenuOpened = false;
  }
}
