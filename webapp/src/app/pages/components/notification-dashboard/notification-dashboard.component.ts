import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import {
  NotificationItem,
  NotificationType,
  NotificationTypeFilter,
  Notification,
} from 'src/app/model/notification-item';
import { NotificationServiceService } from 'src/app/services/notification-service.service';
@Component({
  selector: 'app-notification-dashboard',
  templateUrl: './notification-dashboard.component.html',
  styleUrls: ['./notification-dashboard.component.css'],
})
export class NotificationDashboardComponent implements OnInit {
  notificationItems!: MenuItem[];
  notificationType!: string;
  contextMenuOpened!: boolean;
  temp: any;
  notificationLists: Notification[] = [];
  activeItem!: MenuItem;
  constructor(private notificationService: NotificationServiceService) {}

  ngOnInit(): void {
    this.contextMenuOpened = false;

    this.notificationItems = [
      {
        label: 'All',
        id: 'default',

        command: (event) => this.onTypeSelected(event),
      },
      {
        label: 'Course updates',
        id: 'courseupdates',

        command: (event) => this.onTypeSelected(event),
      },
      {
        label: 'Comments & mentioned',
        id: 'mentionedandreplied',
        command: (event) => this.onTypeSelected(event),
      },
      {
        label: 'Annotations',
        id: 'annotations',
        command: (event) => this.onTypeSelected(event),
      },
    ];

    this.activeItem = this.notificationItems[0];

    this.notificationService.getAllNotifications().subscribe((items) => {
      this.temp = items;
      this.notificationLists = this.temp.notificationLists;
      console.log('lists', this.notificationLists);
      this.notificationService.allNotificationItems.next(
        this.notificationLists
      );
    });
  }

  onTypeSelected(event: any) {
    this.notificationType = event.item.id;
    this.activeItem = this.notificationItems[event.item.id];
    switch (this.notificationType) {
      case 'default':
        this.notificationLists = this.temp.notificationLists;

        break;
      case 'courseupdates':
        this.notificationLists = this.temp.notificationLists.filter(
          (item: { type: string }) => item.type == 'courseupdates'
        );
        break;
      case 'mentionedandreplied':
        this.notificationLists = this.temp.notificationLists.filter(
          (item: { type: string }) => item.type == 'mentionedandreplied'
        );
        break;
      case 'annotations':
        this.notificationLists = this.temp.notificationLists.filter(
          (item: { type: string }) => item.type == 'annotations'
        );
        break;
    }
  }

  openTopContextMenu(event: any, op: any) {
    if (!this.contextMenuOpened) {
      op.show(event);
      this.contextMenuOpened = true;
    } else {
      console.log('closed');
      op.hide(event);
      this.contextMenuOpened = false;
    }
  }

  closeMenu(op: any) {
    op.hide();
    this.contextMenuOpened = false;
  }
}
