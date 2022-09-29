import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { AUTH_API, HTTPOptions } from '../config/config';

@Injectable({
  providedIn: 'root',
})
export class UserServiceService {
  constructor(private http: HttpClient, private router: Router) {}

  login(username: string, password: string): Observable<any> {
    return this.http.post(
      AUTH_API + 'signin',
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
    return this.http.post(
      AUTH_API + 'signup',
      { firstname, lastname, username, email, password },
      HTTPOptions
    );
  }

  logout(): Observable<any> {
    return this.http.post(AUTH_API + 'signout', {}, HTTPOptions);
  }
}
