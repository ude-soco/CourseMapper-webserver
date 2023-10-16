import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';

import { MenuItem, PrimeNGConfig } from 'primeng/api';
import { USER_KEY } from 'src/app/config/config';
import { User } from 'src/app/models/User';
import { StorageService } from 'src/app/services/storage.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { State } from 'src/app/state/app.state';
import { getInitials } from 'src/app/_helpers/format';

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
  public LandingPage = '/landingPage';
  protected loggedInUser$;


  userOptions: MenuItem[] = [
    {
      label: 'Personal Dashboard',
      icon: 'pi pi-chart-bar',
      styleClass: 'navbar-tooltip',
      command: () => this.onViewPersonalDashboard(),
    },
    {
      label: 'Signout',
      icon: 'pi pi-sign-out',
      command: ($event) => this. handleLogout(),
    },
  ];

  constructor(
    private primengConfig: PrimeNGConfig,
    public storageService: StorageService,
    private userService: UserServiceService,
    private router: Router,
    private store: Store<State>
  ) {
    this.isLoggedIn = storageService.isLoggedIn();
    this.store
      .select(getLoggedInUser)
      .subscribe((user) => (this.loggedInUser = user));
  }

  ngOnInit(): void {
    // this.primengConfig.ripple = true;
    // this.isLoggedIn = this.storageService.isLoggedIn();
    // console.log('changes');
    // if (this.isLoggedIn) {
    //   const user = this.storageService.getUser();
    //   this.username = user.username;
    // }
    this.loggedInUser = this.storageService.getUser();
    this.loggedInUser$ = this.store.select(getLoggedInUser);
    // this.isLoggedIn = this.storageService.isLoggedIn();

    // const user = this.storageService.getUser();

    // this.username = user.username;
  }

  handleLogin() {
    this.router.navigate(['/login']);
  }

  handleRegistration() {
    this.router.navigate(['/signup']);
  }

  handleLogout(): void {
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

  copyUserId(userId) {
    navigator.clipboard.writeText(userId);
  }

  onViewPersonalDashboard(): void {

    this.router.navigate([
      'personalDashboard']);
  }
}
