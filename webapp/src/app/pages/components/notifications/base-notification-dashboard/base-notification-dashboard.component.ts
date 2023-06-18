import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
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
import { Router } from '@angular/router';
import * as courseActions from 'src/app/pages/courses/state/course.actions';
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
import { NotificationsService } from 'src/app/services/notifications.service';
import { CourseService } from 'src/app/services/course.service';
@Component({
  selector: 'app-base-notification-dashboard',
  template: '',
  styleUrls: ['./base-notification-dashboard.component.css'],
})
export class BaseNotificationDashboardComponent {
  protected tabOptions: MenuItem[];
  protected menuOptions: MenuItem[];
  private tabSwitchBehaviour: BehaviorSubject<{ category: string }> =
    new BehaviorSubject({
      category: 'All',
    });
  protected notifications$: Observable<Notification[]>;
  protected tabSwitch$: Observable<{ category: string }> =
    this.tabSwitchBehaviour.asObservable();
  protected allNotificationsNumUnread$: Observable<number> = this.store.select(
    getAllNotificationsNumUnread
  );
  protected courseUpdatesNumUnread$: Observable<number> = this.store.select(
    getCourseUpdatesNumUnread
  );
  protected commentsAndMentionedNumUnread$: Observable<number> =
    this.store.select(getCommentsAndMentionedNumUnread);
  protected annotationsNumUnread$: Observable<number> = this.store.select(
    getAnnotationsNumUnread
  );
  protected loading$: Observable<boolean>;

  constructor(
    protected store: Store<State>,
    protected router: Router,
    protected courseService: CourseService
  ) {}

  protected ngOnInit(): void {
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
    this.notifications$ = this.store.select(getFilteredNotifications);
    this.allNotificationsNumUnread$.subscribe((num) => {
      this.tabOptions[0].badge = num.toString();
      let tempTabOptions = [...this.tabOptions];
      tempTabOptions[0].badge = num.toString();
      this.tabOptions = [...tempTabOptions];
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
    this.loading$ = this.notifications$.pipe(
      map((notifications) => (notifications === null ? true : false))
    );
  }

  protected onTabSwitched(selectedItem: MenuItem) {
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

  protected onNotificationClicked(notification: Notification) {
    console.log(notification);
    console.log('navigate to the notification');
    /* this.notificationService.previousURL = this.router.url; */

    if (notification.category === NotificationCategory.CourseUpdate) {
      //need to check if its a material update first
      if (notification.material_id) {
        console.log('its a material update');
        this.courseService.Notification = notification;
        this.courseService.navigatingToMaterial = true;
        /* this.router.navigate(['/course', notification.course_id]); */
        this.router.navigateByUrl(
          '/course/' +
            notification.course_id +
            '/channel/' +
            notification.channel_id +
            '/material/' +
            '(material:' +
            notification.material_id +
            `/${notification.materialType})`
        );
      } else if (notification.channel_id) {
        //check if its a channel update
        this.courseService.Notification = notification;
        this.courseService.navigatingToMaterial = true;
        this.router.navigate([
          '/course',
          notification.course_id,
          'channel',
          notification.channel_id,
        ]);
      } else {
        this.courseService.Notification = notification;
        this.courseService.navigatingToMaterial = true;
        this.router.navigate(['/course', notification.course_id]);
      }
    }
    if (notification.category === NotificationCategory.Annotations) {
      console.log('its an annotation notification');
      this.courseService.Notification = notification;
      this.courseService.navigatingToMaterial = true;
      /* this.router.navigate(['/course', notification.course_id]); */
      this.router.navigateByUrl(
        '/course/' +
          notification.course_id +
          '/channel/' +
          notification.channel_id +
          '/material/' +
          '(material:' +
          notification.material_id +
          `/${notification.materialType})`
      );
    }
  }
}
