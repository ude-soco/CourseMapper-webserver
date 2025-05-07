import { Component, SimpleChanges } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/Course';
import { CourseService } from 'src/app/services/course.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import { Neo4jService } from 'src/app/services/neo4j.service'; 
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
import { environment } from 'src/environments/environment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

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
  private API_URL = environment.API_URL;

  //selectedCourse: Course = new CourseImp('', '');

  constructor(
    private storageService: StorageService,
    private store: Store<State>,
    private userService: UserServiceService,
    private courseService: CourseService,
    private neo4jService: Neo4jService,
    private router: Router,
    private messageService: MessageService,
    private route: ActivatedRoute,
    private socket: Socket,
    private notificationsService: NotificationsService,
    private sanitizer: DomSanitizer,
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
  sanitizeDescription(description: string): SafeHtml {
    // console.log('Sanitizing description:', this.selectedCourse.description);
     return  this.sanitizer.bypassSecurityTrustHtml(
       description
     );
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
              // Create user-course relationship
              this.createRelationship();
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
                // Create user-course relationship
                this.createRelationship();
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
  private createRelationship() {
    const user = this.storageService.getUser(); // Assuming this returns user info
    const userId = user.id; // Get the user ID
    const courseId = this.course_enroll._id; // Get the course ID
    const courseName = this.course_enroll.name; // Get the course ID
  
    // Call the Neo4j service to create the relationship
    this.neo4jService.createUserCourseRelationship(userId, courseId, courseName).subscribe({
      next: () => {
        console.log('User-course relationship created successfully!');
      },
      error: (err) => {
        
        console.error(err);
      },
    });
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

  getCourseImage(course: Course): string {
    if (course.url) {
      //console.log('course.url getCourseImage', course.url);
      // If course.url is already a full URL, return it directly.
      if (course.url.startsWith('http') || course.url.startsWith('https')) {
        
        return course.url 
       //return course.url 
      }
      // Otherwise, prepend the API_URL to form the complete URL.
      

      return this.API_URL + course.url.replace(/\\/g, '/');
    }
    // Return an empty string or a default image if needed.
    //return '/assets/img/courseCard.png';
    return '/assets/img/courseCard.png';
  }

  editCourseName() {
    console.log('Edit course event has been invoked!!');
  }
}
