import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserServiceService } from 'src/app/services/user-service.service';
import { StorageService } from 'src/app/services/storage.service';
import { getCourseSelected, State } from 'src/app/state/app.reducer';
import { Store } from '@ngrx/store';
import { User } from 'src/app/models/User';
import * as ApplicationActions from 'src/app/state/app.actions';
import { async, lastValueFrom, Observable, retryWhen } from 'rxjs';
import { getCurrentCourse } from '../../courses/state/course.reducer';
import { Course } from 'src/app/models/Course';
import { CourseService } from 'src/app/services/course.service';
import * as CourseAction from 'src/app/pages/courses/state/course.actions';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  form: any = {
    username: null,
    password: null,
  };
  isLoggedIn = false;
  isLoginFailed = false;
  errorMessage = '';
  courseSelected$: Observable<boolean>;
  course: any = null;
  myCourses: Course[];

  public signup = '/signup';
  public forgetPassword = '/forgetPassword';
  constructor(
    private userService: UserServiceService,
    private storageService: StorageService,
    private router: Router,
    private courseService: CourseService,
    private store: Store<State>
  ) {
    this.store.select(getCurrentCourse).subscribe((course) => {
      this.course = course;
    });
  }

  ngOnInit(): void {
    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
    }
  }

  onSubmit(): void {
    const { username, password } = this.form;

    this.userService.login(username, password).subscribe({
      // the response from backend
      next: async (data) => {
        console.log('User data from loginnnnnnnnnnnnnnnnnnnnnn:', data); // Log to check photo presence
        this.storageService.saveUser(data);


        this.isLoginFailed = false;
        this.isLoggedIn = true;

        const user = data as User;

        this.store.dispatch(
          ApplicationActions.setLoggedInUser({ loggedInUser: user })
        );
        this.store.dispatch(ApplicationActions.getLastTimeCourseMapperOpened());

        if (this.course) {
          
          try {
            // (async () => {
            //   this.myCourses1= await this.getMyCourses();
            //   console.log( this.myCourses1 ,", after fuc triggered 3")
            // })()
            //solve the problem of Async/awit problem in angular 14
            const data = await lastValueFrom(this.courseService.fetchCourses());
            const courseId = this.course.id || this.course._id

            let varcc = data.find(
              (myCourse) => courseId === myCourse._id
            );

            if (varcc) {
              this.router.navigate(['course', courseId, 'welcome']);
              // this.router.navigate(['course', courseId]);
            } else {
              this.store.dispatch(
                CourseAction.setCurrentCourse({ selcetedCourse: this.course })
              );
              this.store.dispatch(
                CourseAction.setCourseId({ courseId: courseId })
              );
              this.router.navigate(['course-description', courseId]);

              //console.log(selcetedCourse)
            }
          } catch (err) {
            console.log(err);
          }
        } else {
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        console.log(err.error.error);
        this.errorMessage = err.error.error;
        this.isLoginFailed = true;
      },
    });
  }
  async getMyCourses(): Promise<void> {
    this.courseService.fetchCourses().subscribe(async (courses1) => {
      this.myCourses = await courses1;

      return courses1;
    });
  }
  reloadPage(): void {
    window.location.reload();
    this.router.navigate(['./home']);
  }
}
