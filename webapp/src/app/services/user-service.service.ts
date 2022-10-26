import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AUTH_API, AUTH_API_2, HTTPOptions } from '../config/config';

@Injectable({
  providedIn: 'root',
})
export class UserServiceService {
  public resu: any;
  firstname!: string;

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
    return this.http
      .post(
        AUTH_API + 'signup',
        { firstname, lastname, username, email, password },
        HTTPOptions
      )
      .pipe(
        tap((res: { id?: string; success?: string }) => {
          console.log(res.id);
          this.resu = res.id;

          this.register_2(this.resu, username, email, password);
        })
      );
  }

  register_2(_id: string, username: string, email: string, password: string) {
    this.http
      .post<any>(AUTH_API_2 + 'signup', { _id, username, email, password })
      .subscribe((res) => {
        console.log(res);
      });
  }

  logout(): Observable<any> {
    return this.http.post(AUTH_API + 'signout', {}, HTTPOptions);
  }
}
