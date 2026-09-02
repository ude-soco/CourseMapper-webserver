import { Component } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-rec-dashboard-layout',
  templateUrl: './rec-dashboard-layout.component.html',
  styleUrls: ['./rec-dashboard-layout.component.css']
})
export class RecDashboardLayoutComponent {
  loggedInUser: boolean = false;


  constructor(    private storageService: StorageService,
  ) {
    this.loggedInUser = this.storageService.isLoggedIn();

  }
}
