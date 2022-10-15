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

  constructor(private notificationService: NotificationServiceService) {
    this.notificationService.allNotificationItems$.subscribe((items) => {
      this.notificationItems = items;
    });
  }

  ngOnInit(): void {}
}
