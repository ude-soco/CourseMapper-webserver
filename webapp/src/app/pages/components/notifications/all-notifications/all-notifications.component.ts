import { Component } from '@angular/core';
import { BaseNotificationDashboardComponent } from '../base-notification-dashboard/base-notification-dashboard.component';
import { Store } from '@ngrx/store';
import {
  State,
  getAnnotationsNotifications,
  getCommentsAndMentionedNotifications,
  getCourseUpdatesNotifications,
} from '../state/notifications.reducer';
import { Router } from '@angular/router';
import { CourseService } from 'src/app/services/course.service';
import { HttpClient } from '@angular/common/http';
import {
  Notification,
  NotificationCategory,
} from 'src/app/models/Notification';
import { BehaviorSubject, Observable } from 'rxjs';

@Component({
  selector: 'app-all-notifications',
  templateUrl: './all-notifications.component.html',
  styleUrls: ['./all-notifications.component.css'],
})
export class AllNotificationsComponent extends BaseNotificationDashboardComponent {
  courses = ['Angular', 'React', 'Vue', 'Node'];
  selectedCourses = ['Angular', 'React'];
  numberOptions = [5, 10, 15, 20];
  selectedNumber = 5;
  value: string = 'Admin notifications';
  categories = [
    {
      label: 'Course Updates',
      value: NotificationCategory.CourseUpdate,
    },
    {
      label: 'Comments and Mentions',
      value: NotificationCategory.CommentsAndMentioned,
    },
    {
      label: 'Annotations',
      value: NotificationCategory.Annotations,
    },
  ];

  selectedCategory = [
    {
      label: 'Course Updates',
      value: NotificationCategory.CourseUpdate,
    },
    {
      label: 'Comments and Mentions',
      value: NotificationCategory.CommentsAndMentioned,
    },
    {
      label: 'Annotations',
      value: NotificationCategory.Annotations,
    },
  ];

  //obsevable streams
  courseUpdatesNotifications$ = this.store.select(
    getCourseUpdatesNotifications
  );
  commentsAndMentionedNotifications$ = this.store.select(
    getCommentsAndMentionedNotifications
  );
  annotationsNotifications$ = this.store.select(getAnnotationsNotifications);
  isCourseUpdatesNotificationsVisible$ = new BehaviorSubject<boolean>(true);
  isCommentsAndMentionedNotificationsVisible$ = new BehaviorSubject<boolean>(
    true
  );
  isAnnotationsNotificationsVisible$ = new BehaviorSubject<boolean>(true);

  constructor(
    protected override store: Store<State>,
    protected override router: Router,
    protected override courseService: CourseService,
    private httpClient: HttpClient
  ) {
    super(store, router, courseService); // Invoke the superclass constructor
  }

  override ngOnInit(): void {
    this.httpClient.get('assets/data.json').subscribe((data) => {
      console.log(data);
    });
  }

  onFiltersModified($event: any) {
    console.log($event);
    this.categories.forEach((category) => {
      const found = $event.value.find(
        (element: any) => element.value === category.value
      );
      if (found) {
        if (category.value === NotificationCategory.CourseUpdate) {
          this.isCourseUpdatesNotificationsVisible$.next(true);
        }
        if (category.value === NotificationCategory.CommentsAndMentioned) {
          this.isCommentsAndMentionedNotificationsVisible$.next(true);
        }
        if (category.value === NotificationCategory.Annotations) {
          this.isAnnotationsNotificationsVisible$.next(true);
        }
      } else {
        if (category.value === NotificationCategory.CourseUpdate) {
          this.isCourseUpdatesNotificationsVisible$.next(false);
        }
        if (category.value === NotificationCategory.CommentsAndMentioned) {
          this.isCommentsAndMentionedNotificationsVisible$.next(false);
        }
        if (category.value === NotificationCategory.Annotations) {
          this.isAnnotationsNotificationsVisible$.next(false);
        }
      }
    });
  }
}
