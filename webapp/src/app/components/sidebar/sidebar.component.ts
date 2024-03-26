import { CourseImp } from 'src/app/models/CourseImp';
import { Course } from 'src/app/models/Course';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CourseService } from 'src/app/services/course.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import {
  State,
  getLastTimeCourseMapperOpened,
} from 'src/app/state/app.reducer';
import { Store } from '@ngrx/store';
import * as AppActions from 'src/app/state/app.actions';
import { ModeratorPrivilegesService } from 'src/app/services/moderator-privileges.service';
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import * as NotificationActions from 'src/app/pages/components/notifications/state/notifications.actions';
import {
  getAllCourseNotificationSettings,
  getNotifications,
} from 'src/app/pages/components/notifications/state/notifications.reducer';
import { Observable, combineLatest, map, withLatestFrom } from 'rxjs';
import { CourseNotificationSettings } from 'src/app/models/BlockingNotification';
import { Notification } from 'src/app/models/Notification';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  courses: Course[] = [];
  channels: Channel[] = [];
  channel: Channel;
  public LandingPage = '/landingPage';
  public HomePage = '/home';
  public VisDashLandingPage = '/vis-dashboard-landing-page'
  selectedCourse: Course = new CourseImp('', '');
  displayAddCourseDialogue: boolean = false;
  showModeratorPrivileges: boolean;
  allNotifications$: Observable<Notification[]>;
  lastTimeCourseMapperOpened$: Observable<string>;

  constructor(
    private courseService: CourseService,
    private router: Router,
    private topicChannelService: TopicChannelService,
    private store: Store<State>,
    private route: ActivatedRoute,
    private moderatorPrivilegesService: ModeratorPrivilegesService
  ) {}

  ngOnInit(): void {
    this.getCourses();
    this.store.dispatch(
      NotificationActions.loadGlobalAndCoursesNotificationSettings()
    );

    this.allNotifications$ = this.store.select(getNotifications);

    this.lastTimeCourseMapperOpened$ = this.store.select(
      getLastTimeCourseMapperOpened
    );
  }

  getCourses() {
    this.courseService.fetchCourses().subscribe((courses) => {
      this.courses = courses;
      this.store.dispatch(
        AppActions.setSubscribedCourses({ subscribedCourses: courses })
      );
    });

    this.courseService.onUpdateCourses$.subscribe(
      (courses) => (this.courses = courses)
    );
  }

  onAddCourseDialogueClicked() {
    this.toggleAddCoursedialogue(true);
  }

  toggleAddCoursedialogue(visibility) {
    this.displayAddCourseDialogue = visibility;
  }

  onSelectCourse(selectedCourse: Course) {
    if (
      this.courseService.getSelectedCourse()._id.toString() !==
      selectedCourse._id.toString()
    ) {
      let course = this.courses.find(
        (course: Course) => course === selectedCourse
      )!;
      this.selectedCourse = course;
      //1
      this.courseService.selectCourse(course);

      if (this.selectedCourse.numberChannels <= 0) {
        this.topicChannelService.selectChannel(this.channel);
        this.router.navigate(['course', selectedCourse._id, 'welcome']);
        return;
      } else {
        this.channel = this.selectedCourse['channels'][0];
        this.topicChannelService.selectChannel(this.channel);
      }
    }
    this.store.dispatch(
      AppActions.toggleCourseSelected({ courseSelected: true })
    );
    this.store.dispatch(
      CourseActions.setCurrentCourse({ selcetedCourse: selectedCourse })
    );
    this.store.dispatch(
      CourseActions.toggleChannelSelected({ channelSelected: false })
    );
    this.store.dispatch(
      CourseActions.setCourseId({ courseId: selectedCourse._id })
    );
    this.store.dispatch(
      CourseActions.SetSelectedChannel({ selectedChannel: null })
    );
    this.router.navigate(['course', selectedCourse._id, 'welcome']);
  }

  getCourseActivityIndicator(courseId: string) {
    return combineLatest([
      this.allNotifications$,
      this.lastTimeCourseMapperOpened$,
    ]).pipe(
      map(([notifications, lastTimeCourseMapperOpened]) => {
        const lastTimeCourseMapperOpenedConverted = new Date(
          lastTimeCourseMapperOpened
        );
        const notificationsForCourse = notifications.filter(
          (notification) =>
            notification.course_id === courseId &&
            new Date(notification.timestamp) >
              lastTimeCourseMapperOpenedConverted &&
            !notification.isRead
        );
        return notificationsForCourse.length > 0;
      })
    );
  }
}
