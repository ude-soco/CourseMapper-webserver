import { Component, Input, OnInit, ViewChild } from '@angular/core';
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
  notificationLists: Notification[] = [];
  activeItem!: MenuItem;
  courseNews!: string;
  annotationNews!: string;
  repliesNews!: string;
  seeMore: boolean;
  @Input() showDefault: boolean;
  @ViewChild('menu') public menu: HTMLMenuElement;

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

    this.notificationService.selectedTab.subscribe((tab) => {
      this.activeItem = tab;
      this.updateItems(tab);
    });
    this.updateItems('default');

    this.notificationService.clickedMarkAllAsRead$.subscribe(() => {
      this.updateItems(this.activeItem?.id);
      this.notificationLists.forEach((item) => {
        item.read = true;
      });
    });

    this.notificationService.clickedRemoveAll$.subscribe(() => {
      this.notificationLists = [];
    });
    this.notificationService.allNotificationItems$.subscribe((lists) => {
      // this.updateItems('default');

      // update the number
      this.courseNews = lists
        .filter(
          (item: { type: string }) => item.type == NotificationType.CourseUpdate
        )
        .length.toString();

      this.repliesNews = lists
        .filter(
          (item: { type: string }) =>
            item.type == NotificationType.CommentsAndMentioned
        )
        .length.toString();

      this.annotationNews = lists
        .filter((item: { type: string }) => NotificationType.Annotations)
        .length.toString();
    });

    this.notificationService.needUpdate$.subscribe(() => {
      this.updateItems('default');
    });
  }

  updateItems(type: any) {
    this.notificationService.getAllNotifications().subscribe((data) => {
      this.temp = data;
      //5.14.3
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
          // update the number
          this.courseNews = this.temp.notificationLists
            .filter(
              (item: { type: string }) =>
                item.type == NotificationType.CourseUpdate
            )
            .length.toString();

          this.repliesNews = this.temp.notificationLists
            .filter(
              (item: { type: string }) =>
                item.type == NotificationType.CommentsAndMentioned
            )
            .length.toString();

          this.annotationNews = this.notificationLists
            .filter(
              (item: { type: string }) =>
                item.type == NotificationType.Annotations
            )
            .length.toString();

          break;
        case NotificationType.CourseUpdate:
          let tempCourseUpdate = [];
          tempCourseUpdate = this.temp.notificationLists.filter(
            (item: { type: string }) =>
              item.type == NotificationType.CourseUpdate
          );
          this.courseNews = tempCourseUpdate.length.toString();

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
          this.repliesNews = temp.length.toString();

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
          this.annotationNews = tempAnnotations.length.toString();

          if (tempAnnotations.length > 5) {
            this.seeMore = true;

            this.notificationLists = this.limitNumberOfNotifications(temp);
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
    this.activeItem = this.notificationItems[event.item.id];
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
    this.router.navigateByUrl('/allNotification');

    this.notificationService.isPanelOpened.next(false);
  }
}
