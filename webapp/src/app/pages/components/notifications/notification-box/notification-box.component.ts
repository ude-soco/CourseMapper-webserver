import { Component, Input } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationsService } from 'src/app/services/notifications.service';
import { Notification } from 'src/app/models/Notification';
import { MenuItem } from 'primeng/api';
@Component({
  selector: 'app-notification-box',
  templateUrl: './notification-box.component.html',
  styleUrls: ['./notification-box.component.css'],
})
export class NotificationBoxComponent {
  @Input() notification;
  menuOptions: MenuItem[];

  /*  $notificationList: Observable<Notification[]> | undefined; */
  constructor(private notificationService: NotificationsService) {}

  ngOnInit(): void {
    /* this.$notificationList = this.notificationService.$notifications; */
    this.menuOptions = [
      {
        label: 'Mark all as read',
        icon: 'pi pi-check',
        command: () => {
          console.log('Mark all as read clicked');
        },
      },
      {
        label: 'Remove all',
        icon: 'pi pi-times',
        command: () => {
          console.log('Delete clicked');
        },
      },
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        command: () => {
          console.log('Settings clicked');
        },
      },
    ];
  }
}
