import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import {
  Notification,
  NotificationType,
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
  // notificationLists: Notification[] = [];
  activeItem!: MenuItem;

  seeMore: boolean;
  @Input() showDefault: boolean;
  @Input() isPanelOpened: boolean;
  @Input() courseNews: string;
  @Input() repliesNews: string;
  @Input() annotationNews: string;
  @Input() notificationLists: Notification[];
  constructor(
    private notificationService: NotificationServiceService,
    private router: Router
  ) {}

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
        id: NotificationType.CourseUpdate,

        command: (event) => this.onTypeSelected(event),
      },
      {
        label: 'Comments & mentioned',
        id: NotificationType.CommentsAndMentioned,
        command: (event) => this.onTypeSelected(event),
      },
      {
        label: 'Annotations',
        id: NotificationType.Annotations,
        command: (event) => this.onTypeSelected(event),
      },
    ];
    this.activeItem = this.notificationItems[0];

    this.notificationService.selectedTab.subscribe((tab) => {
      if (!tab) return;
      this.activeItem = this.notificationItems[0];
      // this.activeItem.id = tab;

      this.updateItems(tab);
    });
    this.updateItems('default');

    this.notificationService.clickedMarkAllAsRead$.subscribe(() => {
      this.updateItems(this.activeItem);
      this.notificationLists.forEach((item) => {
        item.read = true;
      });
    });
    this.notificationService.isMarkAsRead$.subscribe(() => {
      this.updateItems(this.activeItem);
    });

    this.notificationService.clickedRemoveAll$.subscribe(() => {
      this.notificationLists = [];
    });
    this.notificationService.allNotificationItems$.subscribe(
      (lists: Notification[]) => {}
    );

    this.notificationService.needUpdate$.subscribe((update) => {
      if (update) {
        this.updateItems('default');
        this.notificationService.getAllNotifications().subscribe((data) => {});
      }
    });
  }

  updateItems(type: any) {
    this.notificationService.getAllNotifications().subscribe((data) => {
      this.temp = data;
      switch (type) {
        case 'default':
          this.notificationLists = this.temp.notificationLists;
          if (this.notificationLists.length > 5) {
            this.notificationLists = this.limitNumberOfNotifications(
              this.temp.notificationLists
            );
            this.seeMore = true;
          } else {
            this.notificationLists = this.temp.notificationLists;
            this.seeMore = false;
          }

          break;
        case NotificationType.CourseUpdate:
          let tempCourseUpdate = [];
          tempCourseUpdate = this.temp.notificationLists.filter(
            (item: Notification) => item.type == NotificationType.CourseUpdate
          );

          if (tempCourseUpdate.length > 5) {
            this.seeMore = true;

            this.notificationLists =
              this.limitNumberOfNotifications(tempCourseUpdate);
          } else {
            this.notificationLists = tempCourseUpdate;
            this.seeMore = false;
          }

          break;
        case NotificationType.CommentsAndMentioned:
          let temp = [];
          temp = this.temp.notificationLists.filter(
            (item: { type: string }) =>
              item.type == NotificationType.CommentsAndMentioned
          );

          if (temp.length > 5) {
            this.seeMore = true;

            this.notificationLists = this.limitNumberOfNotifications(temp);
          } else {
            this.notificationLists = temp;
            this.seeMore = false;
          }

          break;
        case NotificationType.Annotations:
          let tempAnnotations = [];
          tempAnnotations = this.temp.notificationLists.filter(
            (item: { type: string }) =>
              item.type == NotificationType.Annotations
          );
          if (tempAnnotations.length > 5) {
            this.seeMore = true;

            this.notificationLists =
              this.limitNumberOfNotifications(tempAnnotations);
          } else {
            this.notificationLists = tempAnnotations;
            this.seeMore = false;
          }

          break;
      }
    });
  }

  limitNumberOfNotifications(lists) {
    const constraintLists = lists.slice(0, 5);
    this.seeMore = true;
    return constraintLists;
  }

  onTypeSelected(event: any) {
    this.notificationType = event.item.id;
    this.activeItem = this.notificationItems[0];
    this.updateItems(this.notificationType);
    this.notificationService.selectedTab.next({ id: this.notificationType });
  }

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

  seeAll() {
    this.router.navigate(['/allNotification'], {
      queryParams: {
        type: this.notificationType ? this.notificationType : 'default',
      },
    });

    this.notificationService.isPanelOpened.next(false);
    console.log('active tab', this.notificationType);
  }

  navigateToSettings() {
    this.router.navigateByUrl('/notification-settings');
    this.notificationService.isPanelOpened.next(false);
  }
}
