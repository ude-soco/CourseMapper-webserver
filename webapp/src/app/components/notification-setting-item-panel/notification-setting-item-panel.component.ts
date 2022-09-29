import { Component, Input, OnInit } from '@angular/core';
import {
  NotificationItem,
  NotificationType,
  NotificationTypeFilter,
} from 'src/app/model/notification-item';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-notification-setting-item-panel',
  templateUrl: './notification-setting-item-panel.component.html',
  styleUrls: ['./notification-setting-item-panel.component.css'],
})
export class NotificationSettingItemPanelComponent implements OnInit {
  @Input() notificationItems: NotificationItem[] = [];

  couseUpdateChecked!: boolean;
  commentsAndMentionedChecked!: boolean;
  annotationsChecked!: boolean;
  notificationTypeFilter: NotificationTypeFilter[] = [];
  courseUpdateItems: NotificationItem[] = [];
  commentsMentionedItems: NotificationItem[] = [];
  annotationsItems: NotificationItem[] = [];
  filteredType!: string;

  constructor(private notificationService: NotificationServiceService) {
    this.notificationTypeFilter = [
      { name: 'Course updates', type: NotificationType.CourseUpdate },
      {
        name: 'Comments & mentioned',
        type: NotificationType.CommentsAndMentioned,
      },
      { name: 'Annotations', type: NotificationType.Annotations },
    ];
    this.couseUpdateChecked = false;
    this.commentsAndMentionedChecked = false;
    this.annotationsChecked = false;
    this.couseUpdateChecked = false;
    this.notificationService.allNotificationItems$.subscribe((items) => {
      this.notificationItems = items;
      this.courseUpdateItems = this.notificationItems.filter(
        (item) => item.message.messageType == 'courseupdate'
      );
      console.log('course update', this.courseUpdateItems);
      this.commentsMentionedItems = this.notificationItems.filter(
        (item) => item.message.messageType == 'commentsandmentioned'
      );
      this.annotationsItems = this.notificationItems.filter(
        (item) => item.message.messageType == 'annotations'
      );
    });
    // this.notificationService.courseUpdateItems$.subscribe((item) => {
    //   this.courseUpdateItems = item;
    // });
    // this.notificationService.commentsMentionedItems$.subscribe((item) => {
    //   this.commentsMentionedItems = item;
    // });
    // this.notificationService.annotationsItems$.subscribe((item) => {
    //   this.annotationsItems = item;
    // });
    this.notificationService.filteredType$.subscribe((type) => {
      this.filteredType = type;
    });
  }

  ngOnInit(): void {}
}
