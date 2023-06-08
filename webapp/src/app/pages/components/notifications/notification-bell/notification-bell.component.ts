import { Component } from '@angular/core';
import { NotificationsService } from 'src/app/services/notifications.service';

//TODO: put this component behind an Auth guard
@Component({
  selector: 'app-notification-bell',
  templateUrl: './notification-bell.component.html',
  styleUrls: ['./notification-bell.component.css'],
})
export class NotificationBellComponent {
  constructor(private notificationsService: NotificationsService) {}

  ngOnInit(): void {
    console.log('Notification bell component initialized');
    console.log('Fetching notifications');
    /*   this.notificationsService.initialiseSocketConnection();
    this.notificationsService.fetchNotifications(); */
  }

  isPanelOpen: boolean = false;

  toggleNotificationPanel($event: any, notificationPanel: any) {
    console.log('Toggling notification panel');
    notificationPanel.show($event);
  }
}
