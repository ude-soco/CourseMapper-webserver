import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Course } from 'src/app/models/Course';
import { CourseService } from 'src/app/services/course.service';
import { StorageService } from 'src/app/services/storage.service';
import { State } from '../courses/state/course.reducer';

import * as CourseAction from 'src/app/pages/courses/state/course.actions';
import { UserServiceService } from 'src/app/services/user-service.service';
import { User } from 'src/app/modules/primeng/UserModule';
import { Roles } from 'src/app/models/Roles';
import { ThisReceiver } from '@angular/compiler';
import { toggleShowHideAnnotation } from '../components/annotations/pdf-annotation/state/annotation.actions';
import { MessageService } from 'primeng/api';
import { environment } from 'src/environments/environment';

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
})
export class LandingPageComponent {
  ids: Array<number> = [1, 2, 3];

  courses = [];
  i: number;
  value1 = '';
  course1: any;
  noCOurse: boolean = false;
  updatedCourses: any;
  currentUser: {} | undefined;
  loggedInUser: boolean = false;
  hideImg: boolean = false;
  username?: string;
  CourseDes: string;
  myCourses: Course[];
  Enrolled: boolean = false;
  createdAt: string;
  private API_URL = environment.API_URL;

  firstName: string = '';
  lastName: string = '';
  activateUpdaeCourse: boolean = false;
  Users: any;
  user = this.storageService.getUser();
  Moderarors: User;
  userArray = [];
  courseTriggered: boolean = false;
  constructor(
    private storageService: StorageService,
    private courseService: CourseService,
    private userService: UserServiceService,
    private router: Router,
    private store: Store<State>,
    private messageService: MessageService
  ) {
    this.loggedInUser = this.storageService.isLoggedIn();

    // const user = this.storageService.getUser();

    // this.username = user.username;
  }

  ngOnInit() {
    this.getAllCourses(); // Fetch all available courses
    if (this.loggedInUser) {
      console.log('User is logged in new test');
      this.fetchUserCourses(); // Fetch courses the user is enrolled in
    }
  }
  fetchUserCourses(): void {
    this.courseService.fetchCourses().subscribe({
      next: (courses) => {
        this.myCourses = courses; // Save user's enrolled courses
      },
      error: (err) => {
        if (err) {
          console.error('Error fetching user courses:', err);
        }
      },
    });
  }
  getAllCourses() {
    this.courseService.GetAllCourses().subscribe({
      next: (courses) => {
        this.courses = courses;
console.log('Courses:', this.courses);
        for (var course of this.courses) {
          this.Users = [];

          this.Users = course.users;

          let userModerator = this.Users.find(
            (user) => user.role.name === 'moderator'
          );

          this.buildCardInfo(userModerator.userId, course);
        }
      },
    });
    if (this.courseTriggered == false) {
      this.courseService.onUpdateCourses$.subscribe({
        next: (courses1) => {
          this.courses = courses1;
          (this.courseTriggered = true), this.ngOnInit();
        },
      });
    }
  }

  buildCardInfo(userModeratorID: string, course: Course) {
    this.userArray = [];
    this.userService.GetUserName(userModeratorID).subscribe((user) => {
      this.firstName = user.firstname;
      this.lastName = user.lastname;

      let ingoPush = {
        id: course._id,
        name: course.name,
        shortName: course.shortName,
        createdAt: new Date(course.createdAt),
        firstName: this.firstName,
        lastName: this.lastName,
        description: course.description,
        url: course.url,
        numberOfUsers: course.numberUsers,
      };
      this.userArray.push(ingoPush);
    });
    this.userArray = [];
  }

  onSelectCourse(selcetedCourse: any) {
    if (this.loggedInUser) {
      try {
        let enrolledCourse = this.myCourses.find(
          (course) => selcetedCourse.id === course._id
        );
        if (enrolledCourse) {
          this.Enrolled = true;
          this.router.navigate(['course', selcetedCourse.id, 'welcome']);
          // this.router.navigate(['course', selcetedCourse.id]);
        } else {
          this.Enrolled = false;
          this.store.dispatch(
            CourseAction.setCurrentCourse({ selcetedCourse: selcetedCourse })
          );
          this.store.dispatch(
            CourseAction.setCourseId({ courseId: selcetedCourse.id })
          );
          this.router.navigate(['course-description', selcetedCourse.id]);
        }
      } catch (error) {
        this.router.navigate(['login']);
        this.showError('Your session has expired. Please login again');
      }
    } else {
      this.store.dispatch(
        CourseAction.setCurrentCourse({ selcetedCourse: selcetedCourse })
      );
      this.store.dispatch(
        CourseAction.setCourseId({ courseId: selcetedCourse.id })
      );
      this.router.navigate(['course-description', selcetedCourse.id]);
    }
  }
  showError(msg) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: msg,
    });
  }

  getCourseImage(course: Course): string {
    if (course.url) {
      // If course.url is already a full URL, return it directly.
      if (course.url.startsWith('http') || course.url.startsWith('https')) {
        return course.url;
      }
      // Otherwise, prepend the API_URL to form the complete URL.
      return this.API_URL + course.url.replace(/\\/g, '/');
    }
    // Return an empty string or a default image if needed.
    return '/assets/img/courseCard.png';
  }
}
