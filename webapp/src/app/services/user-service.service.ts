import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AUTH_API, AUTH_API_2, HTTPOptions } from '../config/config';

import { User } from '../models/User';
import { environment } from 'src/environments/environment';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class UserServiceService {
  // private loggedIn = new BehaviorSubject<boolean>(false); // Initial state is logged out
  // public isLoggedIn$ = this.loggedIn.asObservable(); // Observable for components to subscribe
  public resu: any;
  firstname!: string;
  user: User;
  private API_URL = environment.API_URL;

  constructor(
    private http: HttpClient,
    private router: Router,
    public storageService: StorageService
  ) {}

  login(username: string, password: string): Observable<any> {
    // this.loggedIn.next(true); // Set loggedIn state to true
    return this.http.post(
      AUTH_API_2 + 'signin',
      { username, password },
      HTTPOptions
    );
  }

  register(
    firstname: string,
    lastname: string,
    username: string,
    email: string,
    password: string
  ): Observable<any> {
    return this.http
      .post(
        AUTH_API_2 + 'signup',
        { firstname, lastname, username, email, password },
        HTTPOptions
      )
      .pipe(
        tap((res: { id?: string; success?: string }) => {
          //
          this.resu = res.id;
        })
      );
  }

  forgetPassword(email: string): Observable<any> {
    return this.http.post(AUTH_API_2 + 'sendEmail', { email }, HTTPOptions);
  }
  resetPassword(resetObj): Observable<any> {
    return this.http.post(
      AUTH_API_2 + 'resetPassword',
      { resetObj },
      HTTPOptions
    );
  }
  emailVerification(token: string): Observable<any> {
    return this.http.post(AUTH_API_2 + 'verify', { token }, HTTPOptions);
  }
  resendEmailVerification(token: string): Observable<any> {
    return this.http.post(
      AUTH_API_2 + 'resendVerifyEmail',
      { token },
      HTTPOptions
    );
  }
  logout(): Observable<any> {
    // this.loggedIn.next(false); // Set loggedIn state to false
    this.setlastTimeCourseMapperOpened().subscribe();

     return this.http.post(AUTH_API_2 + 'signout', {}, HTTPOptions);
    // return this.http.post(AUTH_API_2 + 'signout', {}, HTTPOptions).pipe(
    //   tap(() => {
    //     // Clean up storage and notify the navbar component
    //     this.storageService.clean();
    //   })
    // );
  }

  GetUserName(_id: string): Observable<any> {
    return this.http.get<any>(`${this.API_URL}/users/${_id}`).pipe(
      tap((user) => {
        this.user = user;
      })
    );
  }

  setlastTimeCourseMapperOpened() {
    return this.http.put(`${this.API_URL}/user/lastTimeCourseMapperOpened`, {});
  }

  getlastTimeCourseMapperOpened() {
    return this.http.get<{ lastTimeCourseMapperOpened: string }>(
      `${this.API_URL}/user/lastTimeCourseMapperOpened`
    );
  }
}
