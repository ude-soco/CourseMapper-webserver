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
import { BaseNotificationDashboardComponent } from '../base-notification-dashboard/base-notification-dashboard.component';
import { FormBuilder } from '@angular/forms';
@Component({
  selector: 'app-notification-dashboard',
  templateUrl: './notification-dashboard.component.html',
  styleUrls: ['./notification-dashboard.component.css'],
})
export class NotificationDashboardComponent extends BaseNotificationDashboardComponent {
  constructor(
    protected override store: Store<State>,
    protected override router: Router,
    protected override courseService: CourseService,
    protected override fb: FormBuilder
  ) {
    super(store, router, courseService, fb); // Invoke the superclass constructor
  }

  protected override ngOnInit(): void {
    super.ngOnInit();
  }

  /*   tabOptions: MenuItem[];
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
  loading$: Observable<boolean>;

  constructor(
    private store: Store<State>,
    private router: Router,
    private courseService: CourseService
  ) {}

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

  onNotificationClicked(notification: Notification) {
    console.log(notification);
    console.log('navigate to the notification');

    if (notification.category === NotificationCategory.CourseUpdate) {
      //need to check if its a material update first
      if (notification.material_id) {
        console.log('its a material update');
        this.courseService.Notification = notification;
        this.courseService.navigatingToMaterial = true;
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
  } */
}
