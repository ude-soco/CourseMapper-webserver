import { EventEmitter, Injectable, Output } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { User } from '../modules/primeng/UserModule';
import { backendEndpointURL } from '../api';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

const AUTH_API = `${backendEndpointURL}/api/auth/`;

@Injectable({
  providedIn: 'root'
})
export class UserServiceService {

  loggedInUser?: User;
  jwt?: string;
  @Output() loggedInUserChanged: EventEmitter<User | undefined> = new EventEmitter(); 

  constructor(private http: HttpClient, private router: Router) { 
    const jwt = window.localStorage.getItem("jwt");

    if (jwt) {
      this.jwt = jwt;
      this.validateLogIn(jwt);

    }
  }
  
  async login(username: string, password: string) {
    const res = await this.http.post(AUTH_API + 'signin', {
      username,
      password
    }).toPromise(); //,{ withCredentials: true }
    
  console.log(res);

    this.loggedInUser = res as User;
    this.jwt = this.loggedInUser.jwt;
    this.loggedInUserChanged.emit(this.loggedInUser);

    if (this.loggedInUser) {
      window.localStorage.setItem("jwt", this.loggedInUser.jwt);
    } else {
      window.localStorage.removeItem("jwt");
    }

    return res;
  }

 

 register(firstname: string, lastname:string, username: string, email: string, password: string ) {
  console.log('register')
    return  this.http.post(AUTH_API + 'signup', {
      firstname,lastname,username,
      email,
      password, 
    }).toPromise();
}

async validateLogIn(jwt: string) {
  try {
    const res = await this.http.get(AUTH_API + 'validate',
        { headers: new HttpHeaders({ "Authorization": `Bearer ${jwt}` }) }
      ).toPromise();

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
    "Authorization": `Bearer ${this.jwt}`
  });
}
}
