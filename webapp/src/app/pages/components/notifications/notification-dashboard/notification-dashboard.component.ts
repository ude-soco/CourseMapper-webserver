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
import {
  State,
  getAllNotificationsNumUnread,
  getFilteredNotifications,
  getCourseUpdatesNumUnread,
  getCommentsAndMentionedNumUnread,
  getAnnotationsNumUnread,
} from '../state/notifications.reducer';
import { Store } from '@ngrx/store';
import * as NotificationActions from '../state/notifications.actions';
@Component({
  selector: 'app-notification-dashboard',
  templateUrl: './notification-dashboard.component.html',
  styleUrls: ['./notification-dashboard.component.css'],
})
export class NotificationDashboardComponent implements OnInit {
  tabOptions: MenuItem[];
  menuOptions: MenuItem[];
  private tabSwitchBehaviour: BehaviorSubject<{ category: string }> =
    new BehaviorSubject({
      category: 'All',
    });
  notifications$: Observable<Notification[]>;
  tabSwitch$: Observable<{ category: string }> =
    this.tabSwitchBehaviour.asObservable();
  allNotificationsNumUnread$: Observable<number> = this.store.select(
    getAllNotificationsNumUnread
  );
  courseUpdatesNumUnread$: Observable<number> = this.store.select(
    getCourseUpdatesNumUnread
  );
  commentsAndMentionedNumUnread$: Observable<number> = this.store.select(
    getCommentsAndMentionedNumUnread
  );
  annotationsNumUnread$: Observable<number> = this.store.select(
    getAnnotationsNumUnread
  );

  constructor(private http: HttpClient, private store: Store<State>) {}

  //TODO: Unsubscribing the observables
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
    //and make a side effect to update the badge count for each tab
    this.notifications$ = this.store.select(getFilteredNotifications);
    this.allNotificationsNumUnread$.subscribe((num) => {
      this.tabOptions[0].badge = num.toString();
    });
    this.courseUpdatesNumUnread$.subscribe((num) => {
      this.tabOptions[1].badge = num.toString();
    });
    this.commentsAndMentionedNumUnread$.subscribe((num) => {
      this.tabOptions[2].badge = num.toString();
    });
    this.annotationsNumUnread$.subscribe((num) => {
      this.tabOptions[3].badge = num.toString();
    });
  }

  onTabSwitched(selectedItem: MenuItem) {
    console.log(selectedItem);
    if (selectedItem.label === 'All') {
      this.store.dispatch(
        NotificationActions.tabSwitched({ tab: NotificationCategory.All })
      );
    } else if (selectedItem.label === 'Course Updates') {
      this.store.dispatch(
        NotificationActions.tabSwitched({
          tab: NotificationCategory.CourseUpdate,
        })
      );
    } else if (selectedItem.label === 'Comments & Mentioned') {
      this.store.dispatch(
        NotificationActions.tabSwitched({
          tab: NotificationCategory.CommentsAndMentioned,
        })
      );
    } else if (selectedItem.label === 'Annotations') {
      this.store.dispatch(
        NotificationActions.tabSwitched({
          tab: NotificationCategory.Annotations,
        })
      );
    }
  }
}
