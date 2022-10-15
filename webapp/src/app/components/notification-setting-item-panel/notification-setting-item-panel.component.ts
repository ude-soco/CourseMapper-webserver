import { Component, Input, OnInit } from '@angular/core';
import { catchError, tap } from 'rxjs';
import {
  NotificationItem,
  NotificationType,
  NotificationTypeFilter,
  Notification,
} from 'src/app/model/notification-item';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-notification-setting-item-panel',
  templateUrl: './notification-setting-item-panel.component.html',
  styleUrls: ['./notification-setting-item-panel.component.css'],
})
export class NotificationSettingItemPanelComponent implements OnInit {
  @Input() notificationItems: Notification[] = [];

  courseUpdateChecked!: boolean;
  commentsAndMentionedChecked!: boolean;
  annotationsChecked!: boolean;

  notificationTypeFilter: NotificationTypeFilter[] = [];

  courseUpdateItems: Notification[] = [];
  commentsMentionedItems: Notification[] = [];
  annotationsItems: Notification[] = [];
  filteredType!: string;
  temp: any;

  constructor(private notificationService: NotificationServiceService) {
    this.notificationTypeFilter = [
      { name: 'Course updates', type: NotificationType.CourseUpdate },
      {
        name: 'Comments & mentioned',
        type: NotificationType.CommentsAndMentioned,
      },
      { name: 'Annotations', type: NotificationType.Annotations },
    ];
    this.courseUpdateChecked = false;
    this.commentsAndMentionedChecked = false;
    this.annotationsChecked = false;

    this.notificationService.courseUpdateItems$.subscribe((item) => {
      this.courseUpdateItems = item;
    });
    this.notificationService.commentsMentionedItems$.subscribe((item) => {
      this.commentsMentionedItems = item;
    });
    this.notificationService.annotationsItems$.subscribe((item) => {
      this.annotationsItems = item;
    });
    this.getLists();

    this.notificationService.filteredType$.subscribe((type) => {
      this.filteredType = type;
    });
    this.notificationService.isStarClicked$.subscribe((isStar) => {
      if (isStar) {
        this.courseUpdateItems = this.notificationItems.filter(
          (item) => item.type == 'courseupdates' && item.isStar == true
        );
        console.log(this.notificationItems);
        this.commentsMentionedItems = this.notificationItems.filter(
          (item) => item.type == 'mentionedandreplied' && item.isStar == true
        );

        this.annotationsItems = this.notificationItems.filter(
          (item) => item.type == 'annotations' && item.isStar == true
        );
      } else {
        this.getLists();
      }
    });
    this.notificationService.showNumber$.subscribe((number) => {
      this.notificationService.getAllNotifications().subscribe((items) => {
        this.temp = items;
        this.notificationItems = number
          ? this.temp.notificationLists.slice(0, number)
          : this.temp.notificationLists;
        this.getFilteredItems(this.notificationItems);
      });
    });
  }

  getFilteredItems(lists: Notification[]) {
    this.courseUpdateItems = lists.filter(
      (item) => item.type == 'courseupdates'
    );
    this.commentsMentionedItems = lists.filter(
      (item) => item.type == 'mentionedandreplied'
    );

    this.annotationsItems = lists.filter((item) => item.type == 'annotations');
  }

  getLists() {
    this.notificationService.getAllNotifications().subscribe((items) => {
      this.temp = items;
      this.notificationItems = this.temp.notificationLists;
      this.getFilteredItems(this.notificationItems);
    });
  }

  ngOnInit(): void {}

  updateLists() {}

  clear(type: string) {
    switch (type) {
      case 'courseupdates':
        this.notificationService
          .removeByCourseUpdates()
          .subscribe((data: any) => {
            this.getLists();
          });
        break;
      case 'replies':
        this.notificationService.removeByReplies().subscribe((data: any) => {
          this.getLists();
        });

        break;
      case 'annotations':
        this.notificationService.removeByAnnotations().subscribe((data) => {
          this.getLists();
        });
    }
  }

  toggleCourseUpdate(event: any, type: string) {
    console.log('event', event, 'type', type);
    this.notificationService.toggleActiveCourse().subscribe((data) => {
      console.log('response data', data);
    });
  }
  toggleReplies(event: any, type: string) {
    console.log('event', event, 'type', type);
    this.notificationService.toggleReply().subscribe((data) => {
      console.log('response data', data);
    });
  }
  toggleAnnotations(event: any, type: string) {
    console.log('event', event, 'type', type);
    this.notificationService.toggleAnnotation().subscribe((data) => {
      console.log('response data', data);
    });
  }
}
