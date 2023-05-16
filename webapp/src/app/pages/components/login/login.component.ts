import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserServiceService } from 'src/app/services/user-service.service';
import { StorageService } from 'src/app/services/storage.service';
import { State } from 'src/app/state/app.reducer';
import { Store } from '@ngrx/store';
import { User } from 'src/app/models/User';
import * as ApplicationActions from 'src/app/state/app.actions';

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
  public signup="/signup"
  constructor(
    private userService: UserServiceService,
    private storageService: StorageService,
    private router: Router,
    private store: Store<State>
  ) {}

  ngOnInit(): void {
    if (this.storageService.isLoggedIn()) {
      this.isLoggedIn = true;
    }
  }

  onSubmit(): void {
    const { username, password } = this.form;

    this.userService.login(username, password).subscribe({
      // the response from backend
      next: (data) => {
        this.storageService.saveUser(data);

        this.isLoginFailed = false;
        this.isLoggedIn = true;

        const user = data as User;
        
        this.store.dispatch(ApplicationActions.setLoggedInUser({loggedInUser: user}));
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
