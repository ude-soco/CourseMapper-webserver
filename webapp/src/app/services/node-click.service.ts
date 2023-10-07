import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class NodeClickService {

  constructor() { }
  private subject = new Subject<any>();
  nodeClicked(){
    this.subject.next(true);
  }
  nodeObserver():Observable<any>{
    return this.subject.asObservable();
  }
}
