import { Component, Input, OnInit } from '@angular/core';
import { ConfirmationService, MessageService } from 'primeng/api';
import { catchError, tap } from 'rxjs';
import {
  NotificationType,
  NotificationTypeFilter,
  Notification,
} from 'src/app/model/notification-item';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-notification-setting-item-panel',
  templateUrl: './notification-setting-item-panel.component.html',
  styleUrls: ['./notification-setting-item-panel.component.css'],
  providers: [ConfirmationService, MessageService],
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
  filteredType!: NotificationType;
  temp: any;

  constructor(
    private notificationService: NotificationServiceService,
    private confirmationService: ConfirmationService
  ) {
    this.notificationTypeFilter = [
      { name: 'Course updates', type: NotificationType.CourseUpdate },
      {
        name: 'Comments & mentioned',
        type: NotificationType.CommentsAndMentioned,
      },
      { name: 'Annotations', type: NotificationType.Annotations },
    ];
    this.notificationService.getUserIsCourseTurnOff();
    this.notificationService.isCourseTurnOff$.subscribe((isCourseTurnOff) => {
      this.courseUpdateChecked = !isCourseTurnOff;
    });
    this.notificationService.getUserIsRepliesTurnOff();
    this.notificationService.isRepliesTurnOff$.subscribe((isRepliesTurnOff) => {
      this.commentsAndMentionedChecked = !isRepliesTurnOff;
    });
    this.notificationService.getUserIsAnnotationsTurnOff();
    this.notificationService.isAnnotationTurnOff$.subscribe(
      (isAnnotationTurnOff) => {
        this.annotationsChecked = !isAnnotationTurnOff;
      }
    );

    this.notificationService.courseUpdateItems$.subscribe((item) => {
      console.log(item);
      this.courseUpdateItems = item;
    });
    this.notificationService.commentsMentionedItems$.subscribe((item) => {
      this.commentsMentionedItems = item;
    });
    this.notificationService.annotationsItems$.subscribe((item) => {
      this.annotationsItems = item;
    });
    this.getLists();
    this.notificationService.isMarkAsRead$.subscribe(() => {
      this.getLists();
    });
    this.notificationService.clickedRemoveAll$.subscribe(() => {
      this.getLists();
    });
    this.notificationService.filteredType$.subscribe((type) => {
      this.filteredType = type.type;
    });
    this.notificationService.isStarClicked$.subscribe((isStar) => {
      if (isStar) {
        this.courseUpdateItems = this.notificationItems.filter(
          (item) => item.type == 'courseupdates' && item.isStar == true
        );
        this.commentsMentionedItems = this.notificationItems.filter(
          (item) => item.type == 'mentionedandreplied' && item.isStar == true
        );

        this.annotationsItems = this.notificationItems.filter(
          (item) => item.type == 'annotations' && item.isStar == true
        );
      } else {
        this.courseUpdateItems = this.notificationItems.filter(
          (item) => item.type == 'courseupdates'
        );
        this.commentsMentionedItems = this.notificationItems.filter(
          (item) => item.type == 'mentionedandreplied'
        );

        this.annotationsItems = this.notificationItems.filter(
          (item) => item.type == 'annotations'
        );
      }
    });
    this.notificationService.showNumber$.subscribe((number) => {
      this.notificationService.getAllNotifications().subscribe((items) => {
        this.temp = items;
        this.getFilteredItems(this.notificationItems, number);
        console.log('action number', this.notificationItems);
      });
    });
  }

  getFilteredItems(lists: Notification[], number) {
    this.courseUpdateItems = lists
      .filter((item) => item.type == 'courseupdates')
      .slice(0, number.value);
    this.commentsMentionedItems = lists
      .filter((item) => item.type == 'mentionedandreplied')
      .slice(0, number.value);

    this.annotationsItems = lists
      .filter((item) => item.type == 'annotations')
      .slice(0, number.value);
  }

  getLists() {
    this.notificationService.getAllNotifications().subscribe((items) => {
      this.temp = items;
      this.notificationItems = this.temp.notificationLists;
      // what this for?
      this.getFilteredItems(this.notificationItems, 0);
      this.notificationService.allNotificationItems.next(
        this.notificationItems
      );
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
    this.notificationService.toggleActiveCourse().subscribe((data) => {
      console.log('data', data);
    });
  }
  toggleReplies(event: any, type: string) {
    this.notificationService.toggleReply().subscribe((data) => {});
  }
  toggleAnnotations(event: any, type: string) {
    this.notificationService.toggleAnnotation().subscribe((data) => {});
  }

  confirm(event: Event, type: string) {
    console.log(type, event);

    this.confirmationService.confirm({
      message: 'Are you sure to remove all?',
      target: event.target,
      accept: () => {
        this.clear(type);
        //Actual logic to perform a confirmation
        this.notificationService.clickedRemoveAll.next(true);
      },
    });
  }
}
