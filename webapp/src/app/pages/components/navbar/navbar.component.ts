import { Component, OnInit } from '@angular/core';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  newsAmount!: string;
  visibleSidebar2!: any;
  constructor() {
    this.newsAmount = '6';
  }

  ngOnInit(): void {}

  login() {
    console.log('login');
  }
}
