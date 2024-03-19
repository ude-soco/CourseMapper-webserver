import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Socket } from 'ngx-socket-io';

import { MenuItem, PrimeNGConfig, MessageService } from 'primeng/api';
import { Course } from 'src/app/models/Course';
import { User } from 'src/app/models/User';
import { CourseService } from 'src/app/services/course.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { State } from 'src/app/state/app.state';
import { getInitials } from 'src/app/_helpers/format';
import { getCurrentCourse } from '../../courses/state/course.reducer';
@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  onLogout: any;
  isLoggedIn: boolean = false;
  showAdminBoard = false;
  showModeratorBoard = false;
  username?: string;
  loggedInUser: User;
  userOptions: MenuItem[];
  course:any

  public LandingPage = '/landingPage';
  protected loggedInUser$;

  constructor(
    public storageService: StorageService,
    private userService: UserServiceService,
    private router: Router,
    private store: Store<State>,
    private messageService: MessageService,
    private socket: Socket,
    private courseService: CourseService,
  ) {
    this.isLoggedIn = storageService.isLoggedIn();
    this.store
      .select(getLoggedInUser)
      .subscribe((user) => (this.loggedInUser = user));

  }

  ngOnInit(): void {
    this.loggedInUser = this.storageService.getUser();
    this.loggedInUser$ = this.store.select(getLoggedInUser);
    this.userOptions = [
      {
        label: `ID: ${this.loggedInUser.id}`,
        icon: 'pi pi-copy',
        title: 'Copy ID to clipboard',
        command: () => this.copyUserId(this.loggedInUser.id),
      },
      {
        label: 'Personal Dashboard',
        icon: 'pi pi-chart-bar',
        title: 'View your personal dashboard',
        command: () => this.onViewPersonalDashboard(),
      },
      {
        label: 'Sign out',
        icon: 'pi pi-sign-out',
        command: () => this.handleLogout(),
      },
    ];
  }

  handleLogin() {
    this.router.navigate(['/login']);
  }

  handleRegistration() {
    this.router.navigate(['/signup']);
  }

  handleLogout(): void {
    this.store.select(getCurrentCourse).subscribe((course) => {
      this.course = course;
      console.log(this.course)
    });

    //  this.course= this.courseService.getSelectedCourse()

    // console.log(this.course)
    this.socket.emit("leave", "user:"+this.loggedInUser.id);
try{
  this.socket.emit("leave", "course:"+this.course._id);
}
catch{
  console.log("")

}
   // 
    if (window.sessionStorage.length == 0) {
      this.storageService.clean();
      
      this.router.navigate(['/landingPage']);
    }

    this.userService.logout().subscribe({
      next: () => {
        this.storageService.clean();
        this.router.navigate(['/landingPage']);
      },
      error: (err) => {
        console.log(err);
      },
    });
  }

  privacy() {
    this.router.navigate(['/privacy']);
  }
  getIntitials = getInitials;

  copyUserId(userId: string) {
    navigator.clipboard.writeText(userId);
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: 'ID copied to clipboard!',
    });
  }

  onViewPersonalDashboard(): void {
    this.router.navigate(['user/dashboard']);
  }
}
