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

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css'],
})
export class LandingPageComponent {
  ids: Array<number> = [1, 2, 3];

  courses: Array<Course>;
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

  firstName: string = '';
  lastName: string = '';

  Users: any;

  Moderarors: User;
  userArray: any = new Array();
  constructor(
    private storageService: StorageService,
    private courseService: CourseService,
    private userService: UserServiceService,
    private router: Router,
    private store: Store<State>
  ) {
    this.loggedInUser = this.storageService.isLoggedIn();

    // const user = this.storageService.getUser();

    // this.username = user.username;
  }

  ngOnInit() {
    // this.currentUser = this.storageService.getUser();
    this.courseService.fetchCourses().subscribe((courses1) => {
      this.myCourses = courses1;
    });

    this.getAllCourses();
  }

  getAllCourses() {
    this.courseService.GetAllCourses().subscribe({
      next: async (courses) => {
        this.courses = courses;

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
        description:course.description
      };
      this.userArray.push(ingoPush);
      
    });
  }
  //   Search(){

  //  this.updatedCourses = this.courses.find(obj => obj.name === this.value1);
  //   //updatedCourses=coursesList
  //     //this.hideImg=true
  //     console.log(this.updatedCourses);

  //   }
  onSelectCourse(selcetedCourse: any) {
    console.log("Rawaa selcetedCourseId")
    console.log(selcetedCourse)
    // let selcetedCourse = this.courses.find(
    //   (course) => course._id == selcetedCourseId
    // );

    if (this.loggedInUser) {
      let varcc = this.myCourses.find(
        (course) => selcetedCourse.id === course._id
      );
      console.log("varcc");
      console.log(varcc);
      if (varcc) {
        this.Enrolled = true;
        this.router.navigate(['course', selcetedCourse.id]);
      } else {
        this.Enrolled = false;
        this.store.dispatch(CourseAction.setCurrentCourse({ selcetedCourse: selcetedCourse }));
        this.store.dispatch(
          CourseAction.setCourseId({ courseId: selcetedCourse.id })
        );
        this.router.navigate(['course-description', selcetedCourse.id]);
        console.log('course landing page');
        //console.log(selcetedCourse)
      }
      console.log(this.Enrolled);
    } else {
      this.store.dispatch(CourseAction.setCurrentCourse({ selcetedCourse: selcetedCourse }));
      this.store.dispatch(
        CourseAction.setCourseId({ courseId: selcetedCourse.id })
      );
      this.router.navigate(['course-description', selcetedCourse.id]);
    }
  }
}
