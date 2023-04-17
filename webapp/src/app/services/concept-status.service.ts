import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConceptStatusService {

  constructor() { }
  private subject = new Subject<any>();
  statusChanged(){
    this.subject.next(true);
  }
  statusObserver():Observable<any>{
    return this.subject.asObservable();
  }

  private abstractClosedSubject = new Subject<any>();
  abstractStatusChanged(){
    this.abstractClosedSubject.next(true);
    console.log('service called')
  }
  abstractStatusObserver():Observable<any>{
    return this.abstractClosedSubject.asObservable();
  }
}
