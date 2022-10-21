import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { Notification } from 'src/app/model/notification-item';
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
        .filter((item: { type: string }) => item.type == 'courseupdates')
        .length.toString();

      this.repliesNews = lists
        .filter((item: { type: string }) => item.type == 'mentionedandreplied')
        .length.toString();

      this.annotationNews = lists
        .filter((item: { type: string }) => item.type == 'annotations')
        .length.toString();
    });
  }

  updateItems(type: any) {
    this.notificationService.getAllNotifications().subscribe((data) => {
      this.temp = data;

      switch (type) {
        case 'default':
          this.notificationLists = this.temp.notificationLists;
          // update the number
          this.courseNews = this.notificationLists
            .filter((item: { type: string }) => item.type == 'courseupdates')
            .length.toString();

          this.repliesNews = this.notificationLists
            .filter(
              (item: { type: string }) => item.type == 'mentionedandreplied'
            )
            .length.toString();

          this.annotationNews = this.notificationLists
            .filter((item: { type: string }) => item.type == 'annotations')
            .length.toString();

          break;
        case 'courseupdates':
          this.notificationLists = this.temp.notificationLists.filter(
            (item: { type: string }) => item.type == 'courseupdates'
          );
          this.courseNews = this.notificationLists.length.toString();
          break;
        case 'mentionedandreplied':
          this.notificationLists = this.temp.notificationLists.filter(
            (item: { type: string }) => item.type == 'mentionedandreplied'
          );
          this.repliesNews = this.notificationLists.length.toString();

          break;
        case 'annotations':
          this.notificationLists = this.temp.notificationLists.filter(
            (item: { type: string }) => item.type == 'annotations'
          );
          this.annotationNews = this.notificationLists.length.toString();

          break;
      }
    });
  }
  onTypeSelected(event: any) {
    this.notificationType = event.item.id;
    this.activeItem = this.notificationItems[event.item.id];
    this.updateItems(this.notificationType);
    this.notificationService.selectedTab.next(this.notificationType);
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
