import { Component } from '@angular/core';
import {StorageService} from "../../../../services/storage.service";

@Component({
  selector: 'app-vis-dashboard-layout',
  templateUrl: './vis-dashboard-layout.component.html',
  styleUrls: ['./vis-dashboard-layout.component.css']
})
export class VisDashboardLayoutComponent {
  loggedInUser: boolean = false;


  constructor(    private storageService: StorageService,
  ) {
    this.loggedInUser = this.storageService.isLoggedIn();

  }
}
