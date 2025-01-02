import { Component, ElementRef, ViewChild } from '@angular/core';
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
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';

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
  myCourses: Course[] = [];
  Enrolled: boolean = false;
  createdAt: string;
  totalPages: number = 0;
  firstName: string = '';
  lastName: string = '';
  activateUpdaeCourse: boolean = false;
  Users: any;
  user = this.storageService.getUser();
  Moderarors: User;
  userArray = [];
  courseTriggered: boolean = false;
  queryParams: any;
  private searchSubject: Subject<string> = new Subject<string>();
  @ViewChild('scrollAnchor') scrollAnchor: ElementRef;
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
    this.courseService.$queryParams.subscribe((queryParams) => {
      this.queryParams = queryParams;
      this.getAllCourses(this.queryParams);

      if (this.loggedInUser) {
        console.log('User is logged in new test');
        this.fetchUserCourses(this.queryParams);
      }
    });

    this.searchSubject
      .pipe(debounceTime(500), distinctUntilChanged())
      .subscribe((searchText) => {
        this.searchFunction(searchText);
      });
  }
  ngAfterViewInit() {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          if (this.queryParams.page < this.totalPages) {
            this.queryParams = {
              page: (this.queryParams.page || 1) + 1,
            };

            this.courseService.setQueryParams(this.queryParams);
          }
        }
      },
      { threshold: 1.0 }
    );

    observer.observe(this.scrollAnchor.nativeElement);
  }
  fetchUserCourses(queryParams: any): void {
    this.courseService.fetchCourses(queryParams).subscribe({
      next: ({results}: any) => {
        this.myCourses = results;
        console.log(this.myCourses, 'these are the fetch users courses'); // Save user's enrolled courses
      },
      error: (err) => {
        if (err) {
          console.error('Error fetching user courses:', err);
        }
      },
    });
  }
  getAllCourses(queryParams: any) {
    this.courseService.GetAllCourses(queryParams).subscribe({
      next: (courses: any) => {
        this.totalPages = courses.pagination.totalPages;
        if (queryParams.page === 1) {
          this.courses = courses.results;
        } else {
          this.courses = [...this.courses, ...courses.results];
        }

        console.log(courses.results);

        for (var course of this.courses) {
          this.Users = [];

          this.Users = course.users;

          let userModerator = this.Users.find(
            (user) => user?.role?.name === 'teacher'
          );

          if (userModerator) {
            this.buildCardInfo(userModerator.userId, course);
          }
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
        creator: course.creator,
        description: course.description,
        totalEnrolled: course?.users?.length,
      };
      this.userArray.push(ingoPush);
    });
    this.userArray = [];
  }

  onSelectCourse(selcetedCourse: any) {
    if (this.loggedInUser) {
      try {
        let enrolledCourse = this.myCourses?.find(
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
        console.log("🚀 ~ LandingPageComponent ~ onSelectCourse ~ error:", error)
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
  onSearchChange() {
    this.searchSubject.next(this.value1);
  }
  searchFunction(searchText: string) {
    this.courseService.setQueryParams({ search: searchText });
  }
  showError(msg) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: msg,
    });
  }
}
