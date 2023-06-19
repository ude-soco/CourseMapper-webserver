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

  //obsevable streams
  courseUpdatesNotifications$ = this.store.select(
    getCourseUpdatesNotifications
  );
  commentsAndMentionedNotifications$ = this.store.select(
    getCommentsAndMentionedNotifications
  );
  annotationsNotifications$ = this.store.select(getAnnotationsNotifications);
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
}
