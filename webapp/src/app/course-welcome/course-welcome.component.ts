import { Component, Renderer2 } from '@angular/core';
import { Observable } from 'rxjs';
import { Course } from '../models/Course';
import { CourseImp } from '../models/CourseImp';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CourseService } from '../services/course.service';
import { Store } from '@ngrx/store';
import { getCourseSelected, State } from 'src/app/state/app.reducer';
import * as CourseAction from 'src/app/pages/courses/state/course.actions';
import { Router } from '@angular/router';
import { getChannelSelected } from '../pages/courses/state/course.reducer';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { UserServiceService } from '../services/user-service.service';
@Component({
  selector: 'app-course-welcome',
  templateUrl: './course-welcome.component.html',
  styleUrls: ['./course-welcome.component.css'],
})
export class CourseWelcomeComponent {
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

  constructor(
    private confirmationService: ConfirmationService,
    private renderer: Renderer2,
    protected courseService: CourseService,
    private store: Store<State>,
    private router: Router,
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
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
      this.topicChannelService.fetchTopics(course._id).subscribe((course) => {
        this.selectedCourse = course;
        this.Users = course.users;
        let userModerator = this.Users.find(
          (user) => user.role.name === 'moderator'
        );

        this.buildCardInfo(userModerator.userId, course);
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
      if ('success' in res) {
        this.showInfo('You have been  withdrewed successfully ');

        this.store.dispatch(
          CourseAction.setCurrentCourse({ selcetedCourse: course })
        );
        this.router.navigate(['course-description', course._id]);
      }
      (er) => {
        console.log(er);
        alert(er.error.error);
        this.showError('Please make sure to add a valid data!');
      };
    });
  }

  showInfo(msg) {
    this.messageService.add({
      severity: 'info',
      summary: 'Success',
      detail: msg,
    });
  }

  showError(msg) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: msg,
    });
  }
}
