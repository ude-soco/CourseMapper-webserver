import { Component, OnInit } from '@angular/core';
import { NotificationServiceService } from 'src/app/services/notification-service.service';
import { Router } from '@angular/router';

import { PrimeNGConfig } from 'primeng/api';
import { USER_KEY } from 'src/app/config/config';
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
  constructor(
    private primengConfig: PrimeNGConfig,
    public storageService: StorageService,
    private userService: UserServiceService,
    private router: Router,
    private notificationService: NotificationServiceService
  ) {
    // this.notificationService.getAllNotifications().subscribe((data) => {
    //   this.temp = data;
    //   this.newsAmount = this.temp.notificationLists.length;
    // });

    this.notificationService.allNotificationItems$.subscribe((data) => {
      this.newsAmount = data.length;
      console.log(data.length);
    });

    this.isLoggedIn = storageService.loggedIn;
  }

  ngOnInit(): void {
    // this.primengConfig.ripple = true;
    // this.isLoggedIn = this.storageService.isLoggedIn();
    // console.log('changes');
    // if (this.isLoggedIn) {
    //   const user = this.storageService.getUser();
    //   this.username = user.username;
    // }
  }

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
}
