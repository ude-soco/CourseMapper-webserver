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
    private messageService: MessageService,
  ) {
    this.loggedInUser = this.storageService.isLoggedIn();

    // const user = this.storageService.getUser();

    // this.username = user.username;
  }

  ngOnInit() {
    try {
          this.courseService.fetchCourses().subscribe((courses1) => {
      this.myCourses = courses1;
    });
    this.getAllCourses();
    } catch (error) {
      
    }

  }

  getAllCourses() {
    this.courseService.GetAllCourses().subscribe({
      next: (courses) => {
        //console.log("courseService.GetAllCourses triggered")
        this.courses = courses;

        for (var course of this.courses) {
          this.Users = [];

          this.Users = course.users;

          let userModerator = this.Users.find(
            (user) => user.role.name === 'moderator'
          );
          //this.userArray =  []

          // console.log(this.userArray.length, "userArray befre build card")
          // console.log("buildCardInfo go")
          this.buildCardInfo(userModerator.userId, course);
          //console.log(this.userArray.length, "userArray after build card")
          // this.userArray =  []
        }
        // this.userArray =  []
        // console.log(this.userArray, "userArray after build card func" )
        //console.log(this.courses, "GetAllCourses")
      },
    });
    if (this.courseTriggered == false) {
      this.courseService.onUpdateCourses$.subscribe({
        next: (courses1) => {
          // this.courses .push(courses1[courses1.length-1]),

          // console.log(this.userArray, "userArray onUpdateCourses" ),

          // console.log(this.courses, "after"),
          // this.courses = courses1,
          (this.courseTriggered = true), this.ngOnInit();
        },
      });
    }
  }

  buildCardInfo(userModeratorID: string, course: Course) {
    // console.log("buildCardInfo triggered")
    //this.userArray.length=0
    this.userArray = [];
    //console.log(this.userArray, "userArray inside build card func" )
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
      };
      this.userArray.push(ingoPush);
    });
    // console.log(this.userArray, "userArray")
    this.userArray = [];
    // console.log(this.userArray, "userArray end of building card func" )
  }
  //   Search(){

  //  this.updatedCourses = this.courses.find(obj => obj.name === this.value1);
  //   //updatedCourses=coursesList
  //     //this.hideImg=true
  //

  //   }
  onSelectCourse(selcetedCourse: any) {
    console.log(selcetedCourse)
    // let selcetedCourse = this.courses.find(
    //   (course) => course._id == selcetedCourseId
    // );

    if (this.loggedInUser) {
      try {
        let varcc = this.myCourses.find(
          (course) => selcetedCourse.id === course._id
        );
        if (varcc) {
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
  
          //console.log(selcetedCourse)
        }
      } catch (error) {
        this.router.navigate(['login']);
        this.showError("Your session has expired. Please login again");
          
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
}
