import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { User } from '../models/User';

@Injectable({
  providedIn: 'root',
})
export class DNUEngagementKgOrderedService {
  constructor() {}

  private subject = new Subject<any>();
  public selectedUserService: User;

  dnuengagementKgOrdered(user) {
    this.subject.next(true);
    this.selectedUserService = user;
  }
  generateDNUEngagementKG(): Observable<any> {
    return this.subject.asObservable();
  }
}
