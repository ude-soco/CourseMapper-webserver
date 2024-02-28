import { Component, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { Course } from '../models/Course';
import { CourseImp } from '../models/CourseImp';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CourseService } from '../services/course.service';
import { Store } from '@ngrx/store';
import {
  getCourseSelected,
  getShowPopupMessage,
  State,
} from 'src/app/state/app.reducer';
import * as CourseAction from 'src/app/pages/courses/state/course.actions';
import { Router } from '@angular/router';
import {
  getChannelSelected,
  getCurrentCourseId,
} from '../pages/courses/state/course.reducer';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { UserServiceService } from '../services/user-service.service';
import * as AppActions from '../state/app.actions';
import * as NotificationActions from '../pages/components/notifications/state/notifications.actions';
import { IndicatorService } from '../services/indicator.service';
import { Indicator } from '../models/Indicator';
import { ShowInfoError } from '../_helpers/show-info-error';
@Component({
  selector: 'app-course-welcome',
  templateUrl: './course-welcome.component.html',
  styleUrls: ['./course-welcome.component.css'],
  providers: [MessageService, ConfirmationService, DatePipe],
})
export class CourseWelcomeComponent implements OnInit {
  selectedCourse: Course = new CourseImp('', '');
  courseSelected$: Observable<boolean>;
  channelSelected$: Observable<boolean>;
  tagSelected$: Observable<boolean>;
  userArray: any = new Array();
  moderator: boolean = false;
  createdAt: string;
  firstName: string;
  lastName: string;
  Users: any;
  role: string;
  selectedCourseId: string = '';

  showInfoError: ShowInfoError;

  constructor(
    private confirmationService: ConfirmationService,
    private renderer: Renderer2,
    protected courseService: CourseService,
    private store: Store<State>,
    private router: Router,
    private indicatorService: IndicatorService,
    private messageService: MessageService,
    private topicChannelService: TopicChannelService,
    private userService: UserServiceService
  ) {
    this.courseSelected$ = store.select(getCourseSelected);
    this.channelSelected$ = this.store.select(getChannelSelected);
  }

  ngOnInit(): void {
    this.selectedCourse = this.courseService.getSelectedCourse();
    this.Users = [];
    if (this.selectedCourse._id !== '') {
      this.buildCardInfo(this.selectedCourse.users[0].userId, this.selectedCourse);
      if (this.selectedCourse.role === 'moderator') {
        this.moderator = true;
      } else {
        this.moderator = false;
      }
    }
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
      this.selectedCourseId = course._id;
      this.topicChannelService.fetchTopics(course._id).subscribe((res) => {
        this.selectedCourse = res.course;
        this.Users = course.users;
        // TODO: Bad implementation to get the moderator, i.e., course.users[0].userId
        this.buildCardInfo(course.users[0].userId, course);
      });

      if (this.selectedCourse.role === 'moderator') {
        this.moderator = true;
      } else {
        this.moderator = false;
      }
    });
  }

  buildCardInfo(userModeratorID: string, course: Course) {
    this.userService.GetUserName(userModeratorID).subscribe((user) => {
      this.firstName = user.firstname;
      this.lastName = user.lastname;
      this.role = course.role;

      var index = course.createdAt.indexOf('T');
      (this.createdAt = course.createdAt.slice(0, index)),
        course.createdAt.slice(index + 1);
      let ingoPush = {
        id: course._id,
        name: course.name,
        shortName: course.shortName,
        createdAt: this.createdAt,
        firstName: this.firstName,
        lastName: this.lastName,
      };
      this.userArray.push(ingoPush);
    });
  }

  deEnrole() {
    this.confirmationService.confirm({
      message:
        'Are you sure you want to Un Enroll from course"' +
        this.selectedCourse.name +
        '"?',
      header: 'Un-Enroll Confirmation',
      icon: 'pi pi-info-circle',
      accept: (e) => this.unEnrolleCourse(this.selectedCourse),

      reject: () => {
        // this.informUser('info', 'Cancelled', 'Deletion cancelled')
      },
    });
    setTimeout(() => {
      const rejectButton = document.getElementsByClassName(
        'p-confirm-dialog-reject'
      ) as HTMLCollectionOf<HTMLElement>;
      for (var i = 0; i < rejectButton.length; i++) {
        this.renderer.addClass(rejectButton[i], 'p-button-outlined');
      }
    }, 0);
  }

  getName(firstName: string, lastName: string) {
    let Name = firstName + ' ' + lastName;
    return Name.split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  unEnrolleCourse(course: Course) {
    this.courseService.WithdrawFromCourse(course).subscribe((res) => {
      let showInfoError = new ShowInfoError(this.messageService);
      if ('success' in res) {
        // this.showInfoError.showInfo('You have been  withdrewed successfully ');
        // this.showInfo('You are successfully withdrew from the course');
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'You are successfully withdrew from the course',
        });

        this.store.dispatch(
          CourseAction.setCurrentCourse({ selcetedCourse: course })
        );
        this.store.dispatch(CourseAction.setCourseId({ courseId: course._id }));
        this.store.dispatch(
          NotificationActions.isDeletingCourse({ courseId: course._id })
        );
        // this.router.navigate(['course-description', course._id]);
        setTimeout(() => {
          this.router.navigate(['course-description', course._id]);
        }, 850);
      }
      (er) => {
        console.log(er);
        alert(er.error.error);
        this.showInfoError.showError('Please make sure to add a valid data!');
      };
    });
  }
}
