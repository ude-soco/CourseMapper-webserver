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
import { Socket } from 'ngx-socket-io';
import { StorageService } from '../services/storage.service';
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
  showModeratorPrivileges:boolean = true;
  permissions: {} = {};
  user = this.storageService.getUser();
  isBlocked: boolean = false;

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
    private userService: UserServiceService,
    private storageService: StorageService,
    private socket: Socket,
  ) {
    this.courseSelected$ = store.select(getCourseSelected);
    this.channelSelected$ = this.store.select(getChannelSelected);
  }

  ngOnInit(): void {
    this.selectedCourse = this.courseService.getSelectedCourse();
   
    this.Users = [];
    this.courseService.onSelectCourse.subscribe((course) => {
      if (['teacher', 'co_teacher', 'non_editing_teacher'].includes(course?.role) || this.user.role.name === 'admin') {
        this.showModeratorPrivileges = true;
      };
      if (course?.role === 'co_teacher') {
        this.permissions = { ...course.co_teacher_permissions };
      } else if (course?.role === 'non_editing_teacher') {
        this.permissions = { ...course.non_editing_teacher_permissions };
      }
      this.selectedCourse = course;
      this.selectedCourseId = course._id;
      this.topicChannelService.fetchTopics(course._id).subscribe({
        next: (res) => {
            this.selectedCourse = res.course; // Handle successful response
            this.Users = course.users;
            if (course.users.length > 0) {
                this.buildCardInfo(course.users[0].userId, course);
            }
        },
        error: (err) => {
            // Error handling for 403 Forbidden error
            if (err.status === 403) {
                this.isBlocked = true; // Set blocked state
                this.messageService.add({
                    severity: 'error',
                    summary: 'Access Denied',
                    detail: 'You do not have permission to access this course.'
                });
            }
        }
    });


      if (this.selectedCourse.role === 'teacher') {
        this.moderator = true;
      } else {
        this.moderator = false;
      }
    
    });
    if (this.selectedCourse._id !== '') {
      this.buildCardInfo(
        this.selectedCourse.users[0]?.userId,
        this.selectedCourse
      );
      if (this.selectedCourse.role === 'teacher') {
        this.moderator = true;
      } else {
        this.moderator = false;
      }
    }
  
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


  canAccess(perm: string): boolean {
    const isAdminOrTeacher = this.selectedCourse.role === 'teacher' || this.user.role.name === 'admin';

    if (isAdminOrTeacher) {
      return true;
    } else if (this.showModeratorPrivileges && this.permissions?.[perm]) {
      return true;
    }
    return false;
  }

  onRenameCourseDescription() {
    if (this.canAccess('can_edit_course_description')){
      const selectedCurs = <HTMLInputElement>document.getElementById(`des_${this.selectedCourse._id}`);
      this.selectedCourseId = this.selectedCourse._id;
      selectedCurs.contentEditable = 'true';
      this.selectElementContents(selectedCurs);
    }
  }

  handleKeyEvents(id: string, e: KeyboardEvent) {
    const selectedCurs = <HTMLInputElement>document.getElementById(id);

    if (e.key === "Enter") {
      e.preventDefault();
      this.confirmCourseDescription(id);
    } else if (e.key === "Escape") {
      e.preventDefault();
      selectedCurs.innerText = this.selectedCourse.description;
      this.cancelCourseDescription(id);
    }
  }

  
  selectElementContents(el: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
  }

  confirmCourseDescription(id: string) {
    const selectedCurs = <HTMLInputElement>document.getElementById(id);
    selectedCurs.contentEditable = 'false';
    const updatedText = selectedCurs.innerText.trim();

    if (updatedText && updatedText !== this.selectedCourse.description) {
        const body = { description: updatedText };
        this.courseService.renameCourse(this.selectedCourse, body).subscribe({
            next: (res) => {
                // Handle success, e.g., update UI or display a success message
                this.selectedCourse.description = updatedText; // Update local state
            },
            error: (err) => {
                console.error(err);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error Updating Description',
                    detail: 'There was an error updating the course description. Please try again later.'
                });
            }
        });
    }
}

  cancelCourseDescription(id: string) {
    const selectedCurs = <HTMLInputElement>document.getElementById(id);
    selectedCurs.contentEditable = 'false';
    window.getSelection().removeAllRanges(); // Deselect text
  }

  onDeleteCourseDescription() {
    const body = { description: 'N/A' };
    this.courseService.renameCourse(this.selectedCourse, body).subscribe(() => {
      this.selectedCourse.description = '';
    });
  }


  deEnrole() {
    this.confirmationService.confirm({
      message:
        'Are you sure you want to Unenroll from course "' +
        this.selectedCourse.name +
        '"?',
      header: 'Unenroll Confirmation',
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
        this.socket.emit("leave", "course:"+course._id);
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
