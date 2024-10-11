import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ModeratorPrivilegesService {

  constructor() { }
  subject = new BehaviorSubject<any>(false);
  showModeratorPrivileges=false

  setPrivilegesValue(val:boolean){
    this.showModeratorPrivileges=val
    this.subject.next(this.showModeratorPrivileges)
  }

  privilegesObserver():Observable<boolean>{
    return this.subject.asObservable()
  }
}
