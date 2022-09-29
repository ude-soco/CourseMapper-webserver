import { Component, Input, OnInit } from '@angular/core';
import { NotificationItem } from 'src/app/model/notification-item';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-notification-items',
  templateUrl: './notification-items.component.html',
  styleUrls: ['./notification-items.component.css'],
})
export class NotificationItemsComponent implements OnInit {
  notificationItems: NotificationItem[] = [];
  @Input() notificationType!: string;

  courseUpdateItems: NotificationItem[] = [];
  commentsMentionedItems: NotificationItem[] = [];
  annotationsItems: NotificationItem[] = [];

  constructor(private notificationService: NotificationServiceService) {
    this.notificationService.allNotificationItems$.subscribe((items) => {
      this.notificationItems = items;
    });
    this.notificationService.courseUpdateItems$.subscribe((item) => {
      this.courseUpdateItems = item;
    });
    this.notificationService.commentsMentionedItems$.subscribe((item) => {
      this.commentsMentionedItems = item;
    });
    this.notificationService.annotationsItems$.subscribe((item) => {
      this.annotationsItems = item;
    });
    console.log('test', this.notificationItems, this.courseUpdateItems);
  }

  ngOnInit(): void {}
}
