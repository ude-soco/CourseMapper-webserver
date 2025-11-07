import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root',
})
export class UserKgOrderedService {
  constructor() {}

  private subject = new Subject<any>();
  public selectedUserService: User;

  userKgOrdered(user) {
    this.subject.next(true);
    this.selectedUserService = user;
  }
  generateUserKG(): Observable<any> {
    return this.subject.asObservable();
  }
}
