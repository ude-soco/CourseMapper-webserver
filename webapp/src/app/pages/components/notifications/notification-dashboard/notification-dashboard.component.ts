import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  filter,
  map,
  tap,
} from 'rxjs';
import {
  Notification,
  UserNotification,
  NotificationCategory,
} from 'src/app/models/Notification';
@Component({
  selector: 'app-notification-dashboard',
  templateUrl: './notification-dashboard.component.html',
  styleUrls: ['./notification-dashboard.component.css'],
})
export class NotificationDashboardComponent implements OnInit {
  tabOptions: MenuItem[];
  menuOptions: MenuItem[];
  tabSwitchBehaviour: BehaviorSubject<{ category: string }> =
    new BehaviorSubject({
      category: 'All',
    });
  notifications$: Observable<Notification[]>;
  tabSwitch$: Observable<{ category: string }> =
    this.tabSwitchBehaviour.asObservable();
  filteredNotifications$: Observable<Notification[]>;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    //initialising the items for the menu
    this.tabOptions = [
      { label: 'All', badge: '0' },
      { label: 'Course Updates', badge: '0' },
      { label: 'Comments & Mentioned', badge: '0' },
      { label: 'Annotations', badge: '0' },
    ];

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

    //fetch the data data.json for now
    this.notifications$ = this.http
      .get<UserNotification[]>('assets/data.json')
      .pipe(
        tap((notifications) => console.log(notifications)),
        map((notifications) => {
          return notifications.map((notification) => {
            const lastWord =
              notification.activityId.statement.object.definition.type.slice(
                40
              );

            return {
              userShortname:
                notification.activityId.notificationInfo.userShortname,
              courseName: notification.activityId.notificationInfo.courseName,
              username: notification.activityId.notificationInfo.userName,
              action: notification.activityId.statement.verb.display['en-US'],
              name: notification.activityId.statement.object.definition.name[
                'en-US'
              ],
              object: lastWord,
              category: notification.activityId.notificationInfo.category,
            };
          });
        }),
        tap((notifications) => console.log(notifications))
      );

    this.filteredNotifications$ = combineLatest([
      this.notifications$,
      this.tabSwitch$,
    ]).pipe(
      map(([notifications, tabSwitch]) => {
        if (tabSwitch.category === NotificationCategory.All) {
          return notifications;
        }
        return notifications.filter((notification) => {
          return notification.category === tabSwitch.category;
        });
      })
    );
  }

  onTabSwitched(selectedItem: MenuItem) {
    console.log(selectedItem);
    if (selectedItem.label === 'All') {
      this.tabSwitchBehaviour.next({ category: NotificationCategory.All });
    } else if (selectedItem.label === 'Course Updates') {
      this.tabSwitchBehaviour.next({
        category: NotificationCategory.CourseUpdate,
      });
    } else if (selectedItem.label === 'Comments & Mentioned') {
      this.tabSwitchBehaviour.next({
        category: NotificationCategory.CommentsAndMentioned,
      });
    } else if (selectedItem.label === 'Annotations') {
      this.tabSwitchBehaviour.next({
        category: NotificationCategory.Annotations,
      });
    }
  }
}
