import { Component, SimpleChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/Course';
import { CourseService } from 'src/app/services/course.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import * as AppActions from 'src/app/state/app.actions';
import * as NotificationActions from 'src/app/pages/components/notifications/state/notifications.actions';

import {
  getCurrentCourse,
  getCurrentCourseId,
  State,
} from '../../courses/state/course.reducer';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import { MessageService } from 'primeng/api';
import { Socket } from 'ngx-socket-io';
import { NotificationsService } from 'src/app/services/notifications.service';
import { getShowNotificationsPanel } from 'src/app/state/app.reducer';

@Component({
  selector: 'app-course-description',
  templateUrl: './course-description.component.html',
  styleUrls: ['./course-description.component.css'],
  providers: [DatePipe],
})
export class CourseDescriptionComponent {
  course: any;
  CourseId: Observable<string>;
  isloggedin: boolean = false;
  createdAt: string;
  firstName: string;
  lastName: string;
  Enrolled: boolean = false;
  Users: any;
  course_enroll: Course;
  param: any;
  isLoaded: boolean = true;
  //selectedCourse: Course = new CourseImp('', '');

  constructor(
    private storageService: StorageService,
    private store: Store<State>,
    private userService: UserServiceService,
    private courseService: CourseService,
    private router: Router,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private socket: Socket,
    private notificationsService: NotificationsService
  ) {}
  ngOnInit(): void {
    this.isloggedin = this.storageService.isLoggedIn();
    //     this.store
    //   .select(getCurrentCourse)
    //   .subscribe((course) => (this.course_enroll = course));
    this.route.params.subscribe((params) => {
      if (params['courseID']) {
        this.courseService.GetAllCourses().subscribe((courses) => {
          this.course_enroll = courses.find(
            (course) => course._id == params['courseID']
          );

          this.store.dispatch(
            CourseActions.setCurrentCourse({
              selcetedCourse: this.course_enroll,
            })
          );
          this.store.dispatch(
            CourseActions.setCourseId({ courseId: this.course_enroll._id })
          );
          this.Users = [];
          this.Users = this.course_enroll.users;
          var index = this.course_enroll.createdAt.indexOf('T');
          (this.createdAt = this.course_enroll.createdAt.slice(0, index)),
            this.course_enroll.createdAt.slice(index + 1);
          let userModerator = this.Users.find(
            (user) => user.role.name === 'moderator'
          );

          this.buildCardInfo(userModerator.userId, this.course_enroll);
          this.isLoaded = false;
        });
      }
    });
  }
  getName(firstName: string, lastName: string) {
    let Name = firstName + ' ' + lastName;
    return Name.split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }
  buildCardInfo(userModeratorID: string, course: Course) {
    this.userService.GetUserName(userModeratorID).subscribe((user) => {
      this.firstName = user.firstname;
      this.lastName = user.lastname;
    });
  }

  EnrollToCOurse() {
    if (this.isloggedin == false) {
      this.store.dispatch(
        CourseActions.setCurrentCourse({ selcetedCourse: this.course_enroll })
      );
      this.router.navigate(['login']);
    } else if (this.isloggedin == true) {
      this.store.select(getCurrentCourse).subscribe((data) => {
        this.course_enroll = data;
      });

      if (this.course_enroll._id == null) {
        this.courseService
          .EnrollToCOurse(this.course_enroll._id)
          .subscribe((data) => {
            this.Enrolled = true;
            if ('success' in data) {
              this.socket.emit('join', 'course:' + this.course_enroll._id);
              // this.showInfo(res.success);
              this.showInfo('You are successfully enrolled to the course');
            } else {
              this.showError(data.errorMsg);
            }
            setTimeout(() => {
              this.router.navigate([
                'course',
                this.course_enroll._id,
                'welcome',
              ]);
            }, 850);
          });
      } else {
        try {
          this.courseService
            .EnrollToCOurse(this.course_enroll._id)
            .subscribe((data) => {
              if ('success' in data) {
                this.Enrolled = true;
                this.socket.emit('join', 'course:' + this.course_enroll._id);

                this.showInfo('You are successfully enrolled to the course');
              } else {
                this.showError(data.errorMsg);
                if (data.errorMsg.includes('User already enrolled in course')) {
                  const user = this.storageService.getUser();

                  this.socket.emit('JWT', user.token);
                  this.router
                    .navigate(['course', this.course_enroll._id, 'welcome'])
                    .then(() => {
                      // Wait for a short period of time before refreshing the page
                      setTimeout(() => {
                        window.location.href = window.location.href;
                      }, 700); // Adjust the timeout as needed
                    });
                }
              }
              setTimeout(() => {
                this.router.navigate([
                  'course',
                  this.course_enroll._id,
                  'welcome',
                ]);
              }, 850);
            });
        } catch (error) {}
      }
    }
  }
  GoToCOurse() {
    if (this.isloggedin == true) {
      this.router.navigate(['course', this.course_enroll._id]);
    } else {
      this.router.navigate(['login']);
    }
  }
  showInfo(msg) {
    this.messageService.add({
      severity: 'success',
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
