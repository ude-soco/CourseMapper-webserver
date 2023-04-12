import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { USER_KEY } from '../config/config';

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  loggedIn: boolean = Boolean(localStorage.getItem(USER_KEY));

  navBarChange: Subject<boolean> = new Subject<boolean>();

  constructor() {
    this.navBarChange.subscribe((value) => (this.loggedIn = value));
  }

  public clean(): void {

    window.localStorage.removeItem(USER_KEY);
    this.navBarChange.next(false);
  }

  public saveUser(user: any): void {
    localStorage.removeItem(USER_KEY);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    this.navBarChange.next(true);
  }

  public getUser(): any {
    const user = localStorage.getItem(USER_KEY);
    if (user) {
      return JSON.parse(user);
    }
    return {};
  }

  public isLoggedIn(): boolean {
    return Boolean(localStorage.getItem(USER_KEY));
  }
}
