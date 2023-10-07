import { Component, Input, OnInit, Renderer2 } from '@angular/core';
import { NavigationEnd, NavigationStart, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ConfirmationService, MessageService } from 'primeng/api';
import * as CourseAction from 'src/app/pages/courses/state/course.actions';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';
import { CourseService } from 'src/app/services/course.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import { getCourseSelected, State } from 'src/app/state/app.reducer';
import {
  getChannelSelected,
  getCurrentCourse,
  getCurrentCourseId,
  getIsTagSelected,
} from './state/course.reducer';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import { Location } from '@angular/common';
import { NotificationsService } from 'src/app/services/notifications.service';
import { Notification } from 'src/app/models/Notification';
@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class CoursesComponent implements OnInit {
  selectedCourse: Course = new CourseImp('', '');
  courseSelected$: Observable<boolean>;
  tagSelected$: Observable<boolean>;
  course: Course;
  createdAt: string;
  firstName: string;
  lastName: string;
  ChannelToggel: boolean = false;
  Users: any;
  userArray: any = new Array();
  channelSelected$: Observable<boolean>;
  courseId: string;
  moderator: boolean = false;
  notification$: Observable<Notification>;
  isNavigatingToNotificationContextThroughCourseComponent$: Observable<boolean>;
  constructor(
    protected courseService: CourseService,
    private topicChannelService: TopicChannelService,
    private store: Store<State>,
    private userService: UserServiceService,
    private confirmationService: ConfirmationService,
    private renderer: Renderer2,
    private router: Router,
    private messageService: MessageService
  ) {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        if (courseService.navigatingToMaterial) {
          courseService.navigatingToMaterial = false;
          courseService.Notification = null;
          this.reloadCurrentRoute();
        }
      }
      if (event instanceof NavigationEnd) {
        const url = this.router.url;
        if (!url.includes('tag')) {
          this.store.dispatch(CourseActions.selectTag({ tagSelected: false }));
          this.tagSelected$ = this.store.select(getIsTagSelected);
        }
      }
    });
    this.courseSelected$ = store.select(getCourseSelected);
    this.channelSelected$ = this.store.select(getChannelSelected);
  }

  ngOnInit(): void {
    this.ChannelToggel = false;
    this.courseService.onSelectCourse.subscribe((course) => {
      this.ChannelToggel = false;
    });
  }

  NowClicked() {
    this.ChannelToggel = true;
  }

  reloadCurrentRoute() {
    let currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigateByUrl(currentUrl);
    });
  }
}
