import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NotificationServiceService } from 'src/app/services/notification-service.service';
import { Router } from '@angular/router';

import { StorageService } from 'src/app/services/storage.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import {
  Notification,
  NotificationType,
} from 'src/app/model/notification-item';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  newsAmount!: any;
  visibleSidebar2!: any;
  isLoggedIn: boolean = false;

  showAdminBoard = false;
  showModeratorBoard = false;
  username?: string;
  temp: any;
  isPanelOpened = false;
  showNews: boolean;
  courseNews: string;
  repliesNews: string;
  annotationNews: string;
  notificationLists: Notification[];
  @ViewChild(' notificationPanel') notificationPanel: any;
  constructor(
    public storageService: StorageService,
    private userService: UserServiceService,
    private router: Router,
    private notificationService: NotificationServiceService
  ) {
    this.getNotifications();
    this.notificationService.allNotificationItems$.subscribe((data) => {
      if (!data) {
        // this.newsAmount = 0;
        this.showNews = false;
      } else {
        this.showNews = true;

        this.newsAmount = this.getUnreadMessage(data);
      }
    });
    this.notificationService.isMarkAsRead$.subscribe(() => {
      this.getNotifications();
    });

    this.notificationService.clickedMarkAllAsRead$.subscribe(() => {
      this.getNotifications();
    });

    this.notificationService.isPanelOpened$.subscribe((isOpened) => {
      if (!isOpened) {
        this.notificationPanel.hide();
        this.isPanelOpened = false;
      }
    });
    this.notificationService.needUpdate$.subscribe(() => {
      this.getNotifications();

      console.log(
        'update needed on nave bar for real time update after deployed'
      );
    });

    this.isLoggedIn = storageService.loggedIn;
  }

  getUnreadMessage(notificationLists: Notification[]) {
    let unreadMessage = [];

    unreadMessage = notificationLists.filter(
      (notification) => notification.read == false
    );
    this.courseNews = notificationLists
      .filter(
        (notification) =>
          notification.read == false &&
          notification.type == NotificationType.CourseUpdate
      )
      .length.toString();

    this.repliesNews = notificationLists
      .filter(
        (notification) =>
          notification.read == false &&
          notification.type == NotificationType.CommentsAndMentioned
      )
      .length.toString();

    this.annotationNews = notificationLists
      .filter(
        (notification) =>
          notification.read == false &&
          notification.type == NotificationType.Annotations
      )
      .length.toString();

    return unreadMessage.length;
  }

  getNotifications() {
    this.notificationService.getAllNotifications().subscribe((items) => {
      if (items) {
        this.temp = items;
        this.newsAmount = this.getUnreadMessage(this.temp.notificationLists);
        this.showNews = true;
        this.notificationLists = this.limitNumberOfNotifications(
          this.temp.notificationLists
        );
      }
    });
  }

  ngOnInit(): void {}

  handleLogin() {
    this.router.navigate(['/login']);
  }

  handleRegistration() {
    this.router.navigate(['/signup']);
  }

  handleLogout(): void {
    this.userService.logout().subscribe({
      next: () => {
        this.storageService.clean();
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  toggleNotificationPanel(event: any, notificationPanel: any) {
    if (!this.isPanelOpened) {
      notificationPanel.show(event);
      this.isPanelOpened = true;
      this.notificationService.isPanelOpened.next(true);
      this.notificationService.selectedTab.next({ id: 'default' });
      this.getNotifications();
      console.log('open dashboard');
    } else {
      this.notificationService.selectedTab.next({ id: 'default' });

      notificationPanel.hide(event);
      this.isPanelOpened = false;
      this.notificationService.isPanelOpened.next(false);
    }
  }
  onShow() {
    this.isPanelOpened = true;

    this.notificationService.selectedTab.next({ id: 'default' });
  }
  onHide() {
    this.isPanelOpened = false;
    this.notificationService.selectedTab.next({ id: 'default' });
  }

  limitNumberOfNotifications(lists) {
    const constraintLists = lists.slice(0, 5);
    return constraintLists;
  }
}
