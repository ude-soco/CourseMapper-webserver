import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { NotificationServiceService } from 'src/app/services/notification-service.service';
import { Router } from '@angular/router';

import { StorageService } from 'src/app/services/storage.service';
import { UserServiceService } from 'src/app/services/user-service.service';

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

  @ViewChild(' notificationPanel') notificationPanel: any;
  constructor(
    public storageService: StorageService,
    private userService: UserServiceService,
    private router: Router,
    private notificationService: NotificationServiceService
  ) {
    this.notificationService.getAllNotifications().subscribe((items) => {
      this.temp = items;
      this.newsAmount = this.temp.notificationLists.length;
    });

    this.notificationService.allNotificationItems$.subscribe((data) => {
      if (!data) this.newsAmount = 0;
      this.newsAmount = data.length;
    });

    this.notificationService.isPanelOpened$.subscribe((isOpened) => {
      if (!isOpened) {
        this.notificationPanel.hide();
        this.isPanelOpened = false;
      }
    });
    this.notificationService.needUpdate$.subscribe(() => {
      console.log(
        'update needed on nave bar for real time update after deployed'
      );
    });

    this.isLoggedIn = storageService.loggedIn;
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
}
