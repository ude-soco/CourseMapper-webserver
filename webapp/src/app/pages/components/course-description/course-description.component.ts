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
import {
  getCurrentCourse,
  getCurrentCourseId,
  State,
} from '../../courses/state/course.reducer';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import { MessageService } from 'primeng/api';
import { Socket } from 'ngx-socket-io';

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
    private socket:Socket
  ) {}
  ngOnInit(): void {
    this.isloggedin = this.storageService.isLoggedIn();
    //     this.store
    //   .select(getCurrentCourse)
    //   .subscribe((course) => (this.course_enroll = course));
    this.route.params.subscribe((params) => {
      if (params['courseID']) {
    this.courseService.GetAllCourses().subscribe((courses) => {
      this.course_enroll = courses.find((course) => course._id == params['courseID']);

      this.store.dispatch(
        CourseActions.setCurrentCourse({
          selcetedCourse: this.course_enroll,
        })
      );
      this.store.dispatch(
        CourseActions.setCourseId({ courseId: this.course_enroll._id })
      );
      this.Users = [];
      //console.log(this.course, "course found from des page")
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
      console.log(this.course_enroll, 'this.course');
      this.store.dispatch(
        CourseActions.setCurrentCourse({ selcetedCourse: this.course_enroll })
      );
      this.router.navigate(['login']);
    } else if (this.isloggedin == true) {
      
      this.store.select(getCurrentCourse).subscribe((data) => {
        
        this.course_enroll = data;
      
      });

      if (this.course_enroll._id == null) {
        console.log('entered');
        
        console.log("emitted")
        this.courseService
          .EnrollToCOurse(this.course_enroll._id)
          .subscribe((data) => {
            this.Enrolled = true;
            console.log('response after calling the service', data);
            if ('success' in data) {
              this.socket.emit("join", "course:"+this.course_enroll._id);
              console.log('entered success msg');
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
        
        this.courseService.EnrollToCOurse(this.course_enroll._id).subscribe((data) => {
          this.Enrolled = true;
          console.log('data', data);
          //if ( "write something here".indexOf("write som") > -1 )  { alert( "found it" );  }

          if ('success' in data) {
            this.socket.emit("join", "course:"+this.course_enroll._id);
            console.log('entered success msg');
            // this.showInfo(res.success);
            this.showInfo('You are successfully enrolled to the course');
          } else {
            this.showError(data.errorMsg);
          }
          setTimeout(() => {
            this.router.navigate(['course', this.course_enroll._id, 'welcome']);
          }, 850);
        });
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
