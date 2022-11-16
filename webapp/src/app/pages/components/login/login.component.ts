import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserServiceService } from 'src/app/services/user-service.service';
import { StorageService } from 'src/app/services/storage.service';
import { NotificationServiceService } from 'src/app/services/notification-service.service';
import { CustomDatePipe } from 'src/app/pipes/date.pipe';
import { AnnotationService } from 'src/app/services/annotation.service';
import { CourseService } from 'src/app/services/course.service';

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
  temp: any;
  constructor(
    private userService: UserServiceService,
    private storageService: StorageService,
    private router: Router,
    private notificationService: NotificationServiceService,
    private annotationService: AnnotationService,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
    }

    this.notificationService.needUpdate$.subscribe(() => {
      this.getNotifications();
    });
  }
  getNotifications() {
    this.notificationService.getAllNotifications().subscribe((data) => {
      this.temp = data;
      this.notificationService.allNotificationItems.next(
        this.temp.notificationLists
      );
    });
  }
  onSubmit(): void {
    const { username, password } = this.form;

    const previousTime = !!localStorage.getItem('loggedInTime')
      ? localStorage.getItem('loggedInTime')
      : new Date('01.01.2022').getTime();

    this.notificationService.loggedInTime.next(
      new Date(Number(previousTime)).getTime()
    );

    this.userService.login(username, password).subscribe({
      // the response from backend
      next: (data) => {
        this.storageService.saveUser(data);

        this.isLoginFailed = false;
        this.isLoggedIn = true;

        let loggedTime = Date.now();

        localStorage.setItem('loggedInTime', JSON.stringify(loggedTime));

        this.getNotifications();
        this.courseService.getSubscribedCourseLists();
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.log(err.error.error);
        this.errorMessage = err.error.error;
        this.isLoginFailed = true;
      },
    });
  }

  reloadPage(): void {
    window.location.reload();
    this.router.navigate(['./home']);
  }
}
