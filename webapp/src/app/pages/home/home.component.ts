import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { StorageService } from 'src/app/services/storage.service';
import { State } from 'src/app/state/app.reducer';
import * as AppActions from 'src/app/state/app.actions';
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions';
import { CourseService } from 'src/app/services/course.service';
import { Course } from 'src/app/models/Course';
import * as CourseAction from 'src/app/pages/courses/state/course.actions';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import { UserServiceService } from 'src/app/services/user-service.service';
import { environment } from 'src/environments/environment';
import { url } from 'inspector';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DatePipe],
})
export class HomeComponent implements OnInit {
  currentUser: {} | undefined;
  isloggedin: boolean = false;
  username?: string;
  courses: Course[] = [];
  Allcourses: Course[] = [];
  Users: any;
  userArray: any = new Array();
  createdAt: string;
  private API_URL = environment.API_URL;

  firstName: string = '';
  lastName: string = '';
  courseTriggered: boolean = false;
  constructor(
    private storageService: StorageService,
    private router: Router,
    private store: Store<State>,
    private courseService: CourseService,
    private userService: UserServiceService
  ) {
    this.courseService.GetAllCourses().subscribe({
      next: async (courses) => {
        this.Allcourses = courses;
      },
    });
  }

  ngOnInit(): void {
    this.currentUser = this.storageService.getUser();
    this.isloggedin = this.storageService.isLoggedIn();

    this.store.dispatch(
      AppActions.toggleCourseSelected({ courseSelected: false })
    );
    this.store.dispatch(CourseActions.setCurrentTopic({ selcetedTopic: null }));
    this.store.dispatch(
      CourseActions.setCurrentCourse({ selcetedCourse: null })
    );
    this.store.dispatch(CourseActions.setCourseId({ courseId: null }));
    this.store.dispatch(
      CourseActions.SetSelectedChannel({ selectedChannel: null })
    );
    this.store.dispatch(
      CourseActions.toggleChannelSelected({ channelSelected: false })
    );

    if (this.isloggedin == false) {
      this.router.navigate(['login']);
    } else {
      const user = this.storageService.getUser();

      this.username = user.username;
    }

    this.getMyCourses();
  }
  getMyCourses() {
    this.courseService.fetchCourses().subscribe((courses) => {
      this.courses = courses;

      for (var course of this.courses) {
        this.Users = [];
        console.log(' the retrived course url is: ', course);
        this.Users = course.users;
        // console.log(course.users[0].role.name)
        //       let userModerator = this.Users.find(
        //         (user) => user.role.id === 'moderator'
        //       );

        this.buildCardInfo(course.users[0].userId, course);
      }
    });
    if (this.courseTriggered == false) {
      this.courseService.onUpdateCourses$.subscribe({
        next: (courses1) => {
          // this.courses .push(courses1[courses1.length-1]),
          // console.log(this.courses, "before"),

          // console.log(this.courses, "after"),
          (this.courseTriggered = true), this.ngOnInit();
        },
      });
    }
  }
  buildCardInfo(userModeratorID: string, course: Course) {
    this.userArray.length = 0;
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
  }
  onSelectCourse(selcetedCourse: any) {
    /* this.router.navigate(['course', selcetedCourse.id]); */
    this.courseService.logCourses(selcetedCourse.id).subscribe(() => {
      this.router.navigate(['course', selcetedCourse.id, 'welcome']);
      this.store.dispatch(
        CourseAction.setCurrentCourse({ selcetedCourse: selcetedCourse })
      );
      this.store.dispatch(
        CourseActions.setCourseId({ courseId: selcetedCourse.id })
      );
    });
  }
  getCourseImage(course: Course): string {
    if (course.url) {
      // If course.url is already a full URL, return it directly.
      if (course.url.startsWith('http')) {
        return course.url;
      }
      // Otherwise, prepend the API_URL to form the complete URL.
      return this.API_URL + course.url.replace(/\\/g, '/');
    }
    // Return an empty string or a default image if needed.
    return '/assets/img/courseCard.png';
  }
}
