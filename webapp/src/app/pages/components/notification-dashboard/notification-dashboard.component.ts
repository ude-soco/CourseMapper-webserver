import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';

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
  constructor(private notificationService: NotificationServiceService) {}

  ngOnInit(): void {
    this.contextMenuOpened = false;
    this.notificationItems = [
      {
        label: 'Course updates',
        id: 'courseupdate',

        command: (event) => this.onTypeSelected(event),
      },
      {
        label: 'Comments & mentioned',
        id: 'commentsandmentioned',
        command: (event) => this.onTypeSelected(event),
      },
      {
        label: 'Annotations',
        id: 'annotations',
        command: (event) => this.onTypeSelected(event),
      },
    ];
  }

  onTypeSelected(event: any) {
    this.notificationType = event.item.id;
  }

  openTopContextMenu(event: any, op: any) {
    if (!this.contextMenuOpened) {
      op.show(event);
      this.contextMenuOpened = true;
    } else {
      op.hide();
      this.contextMenuOpened = false;
    }
  }

  closeMenu(op: any) {
    op.hide();
    this.contextMenuOpened = false;
  }
}
