import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { User } from '../modules/primeng/UserModule';
import { backendEndpointURL } from '../api';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

const AUTH_API = `${backendEndpointURL}/api/auth/`;
const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' }),  withCredentials: true 
};

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {

  
  

  constructor(private http: HttpClient, private router: Router) { }
  login(username: string, password: string): Observable<any> {
    return this.http.post(
      AUTH_API + 'signin',
      {
        username,
        password,
      },
      httpOptions,
    );
  }

  register(firstname: string, lastname:string, username: string, email: string, password: string): Observable<any> {
    return this.http.post(
      AUTH_API + 'signup',
      {
        firstname,
        lastname, 
        username,
        email,
        password,
      },
      httpOptions
    );
  }

  logout(): Observable<any> {
    return this.http.post(AUTH_API + 'signout', { }, httpOptions);
  }
}
