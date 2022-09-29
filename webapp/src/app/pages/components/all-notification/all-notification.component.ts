import { Component, OnInit } from '@angular/core';
import { NotificationItem } from 'src/app/model/notification-item';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-all-notification',
  templateUrl: './all-notification.component.html',
  styleUrls: ['./all-notification.component.css'],
})
export class AllNotificationComponent implements OnInit {
  notificationItems: NotificationItem[] = [];

  constructor(private notificationService: NotificationServiceService) {
    this.notificationService.allNotificationItems$.subscribe((items) => {
      this.notificationItems = items;
    });
  }

  ngOnInit(): void {}
}
