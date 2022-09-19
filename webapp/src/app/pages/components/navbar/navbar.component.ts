import { Component, OnInit } from '@angular/core';

import { PrimeNGConfig } from 'primeng/api';
import { StorageService } from 'src/app/Services/storage.service'; 
import { UserServiceService } from 'src/app/Services/user-service.service'; 

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  isLoggedIn = false;
  showAdminBoard = false;
  showModeratorBoard = false;
  username?: string;
  constructor(private primengConfig: PrimeNGConfig, private storageService: StorageService, private userService: UserServiceService) {}

  ngOnInit(): void {
    this.primengConfig.ripple = true;
    this.isLoggedIn = this.storageService.isLoggedIn();

    if (this.isLoggedIn) {
      const user = this.storageService.getUser();


      this.username = user.username;
    }
  }

  login() {
    console.log('login');
  }
  logout(): void {
    this.userService.logout().subscribe({
      next: res => {
        console.log(res);
        this.storageService.clean();
      },
      error: err => {
        console.log(err);
      }
    });
    
    window.location.reload();
  }
}
