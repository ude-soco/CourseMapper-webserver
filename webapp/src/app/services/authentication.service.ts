import { HttpClient, HttpHeaders } from '@angular/common/http';
import { EventEmitter, Injectable, Output } from '@angular/core';
import { Router } from '@angular/router';
import { User } from 'src/assets/data/User';
import { backendEndpointURL } from '../api';

const AUTH_API = `${backendEndpointURL}auth/`;

@Injectable({
  providedIn: 'root',
})
export class AuthenticationService {
  loggedInUser?: User;
  jwt?: string;

  @Output() loggedInUserChanged: EventEmitter<User | undefined> =
    new EventEmitter();

  constructor(private http: HttpClient, private router: Router) {
    const jwt = window.localStorage.getItem('jwt');

    if (jwt) {
      this.jwt = jwt;
      this.validateLogIn(jwt);
    }
  }

  async login(email: string, password: string, rememberMe: boolean) {
    const res = await this.http
      .post(AUTH_API + 'login', {
        email,
        password,
        rememberMe,
      })
      .toPromise();

    this.loggedInUser = res as User;
    this.jwt = this.loggedInUser.jwt;
    this.loggedInUserChanged.emit(this.loggedInUser);

    if (this.loggedInUser) {
      window.localStorage.setItem('jwt', this.loggedInUser.jwt);
    } else {
      window.localStorage.removeItem('jwt');
    }

    return res;
  }

  register(username: string, email: string, password: string) {
    return this.http
      .post(AUTH_API + 'signup', {
        username,
        email,
        password,
      })
      .toPromise();
  }

  logout() {
    this.loggedInUser = undefined;
    this.jwt = undefined;
    this.loggedInUserChanged.emit(undefined);

    window.localStorage.removeItem('jwt');
  }

  async validateLogIn(jwt: string) {
    try {
      const res = await this.http
        .get(AUTH_API + 'validate', {
          headers: new HttpHeaders({ Authorization: `Bearer ${jwt}` }),
        })
        .toPromise();

      this.loggedInUser = res as User;
      this.loggedInUserChanged.emit(this.loggedInUser);
    } catch (e) {
      this.router.navigate(['login']);
    }
  }

  getLoggedInUser(): User | undefined {
    return this.loggedInUser;
  }

  getHTTPHeaders(): HttpHeaders {
    if (!this.jwt) return new HttpHeaders({});

    return new HttpHeaders({
      Authorization: `Bearer ${this.jwt}`,
    });
  }
}
