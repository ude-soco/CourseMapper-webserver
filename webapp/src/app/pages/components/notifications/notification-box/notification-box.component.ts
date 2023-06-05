import { Component } from '@angular/core';
import { Observable } from 'rxjs';
import { NotificationsService } from 'src/app/services/notifications.service';
import { Notification } from 'src/app/models/Notification';
@Component({
  selector: 'app-notification-box',
  templateUrl: './notification-box.component.html',
  styleUrls: ['./notification-box.component.css'],
})
export class NotificationBoxComponent {
  $notificationList: Observable<Notification[]> | undefined;
  constructor(private notificationService: NotificationsService) {}

  ngOnInit(): void {
    this.$notificationList = this.notificationService.$notifications;
  }
}
