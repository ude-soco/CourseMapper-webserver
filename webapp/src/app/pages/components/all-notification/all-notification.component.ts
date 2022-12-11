import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NotificationServiceService } from 'src/app/services/notification-service.service';
import {
  Notification,
  NotificationType,
} from 'src/app/model/notification-item';
@Component({
  selector: 'app-all-notification',
  templateUrl: './all-notification.component.html',
  styleUrls: ['./all-notification.component.css'],
})
export class AllNotificationComponent implements OnInit {
  notificationItems: Notification[] = [];
  temp: any;
  contextMenuOpened!: boolean;
  type: string;
  constructor(
    private route: ActivatedRoute,
    private notificationService: NotificationServiceService,
    private router: Router
  ) {
    console.log(this.route.snapshot.queryParams);
    this.route.queryParams.subscribe((params: any) => {
      switch (params.type) {
        case 'default':
          this.type = 'All notifications';
          this.notificationService.getAllNotifications().subscribe((items) => {
            this.temp = items;
            this.notificationItems = this.temp.notificationLists;
          });
          break;

        case 'courseupdates':
          this.type = 'Course update notifications';

          this.notificationService
            .getAllNotifications()
            .subscribe((items: any) => {
              this.temp = items;

              this.notificationItems = this.temp.notificationLists.filter(
                (item: Notification) =>
                  item.type == NotificationType.CourseUpdate
              );
            });

          break;

        case 'mentionedandreplied':
          this.type = 'Replies & mentions notifications';

          this.notificationService
            .getAllNotifications()
            .subscribe((items: any) => {
              this.temp = items;

              this.notificationItems = this.temp.notificationLists.filter(
                (item: Notification) =>
                  item.type == NotificationType.CommentsAndMentioned
              );
            });

          break;

        case 'annotations':
          this.type = 'Annotation notifications';

          this.notificationService
            .getAllNotifications()
            .subscribe((items: any) => {
              this.temp = items;

              this.notificationItems = this.temp.notificationLists.filter(
                (item: Notification) =>
                  item.type == NotificationType.Annotations
              );
            });

          break;
      }
    });

    // this.notificationService.allNotificationItems$.subscribe((items) => {
    //   this.notificationItems = items;
    // });

    // this.notificationService.getAllNotifications().subscribe((items) => {
    //   this.temp = items;
    //   this.notificationItems = this.temp.notificationLists;
    // });
    // this.notificationService.clickedMarkAllAsRead$.subscribe(() => {
    //   this.notificationItems.forEach((item) => {
    //     item.read = true;
    //   });
    // });
    // this.notificationService.clickedRemoveAll$.subscribe(() => {
    //   this.notificationItems = [];
    // });
  }

  ngOnInit(): void {}

  openTopContextMenu(event: any, op: any) {
    if (!this.contextMenuOpened) {
      op.show(event);
      this.contextMenuOpened = true;
    } else {
      op.hide(event);
      this.contextMenuOpened = false;
    }
  }

  closeMenu(op: any) {
    op.hide();
    this.contextMenuOpened = false;
  }
  navigateToSettings() {
    this.router.navigateByUrl('/notification-settings');
    this.notificationService.isPanelOpened.next(false);
  }
}
