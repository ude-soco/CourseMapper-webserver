import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root',
})
export class EngagementKgOrderedService {
  constructor() {}

  private subject = new Subject<any>();
  public selectedUserService: User;

  engagementKgOrdered(user) {
    this.subject.next(true);
    this.selectedUserService = user;
  }
  generateEngagementKG(): Observable<any> {
    return this.subject.asObservable();
  }
}
