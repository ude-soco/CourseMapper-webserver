import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class GraphRenderedService {

  constructor() { }
  private subject = new Subject<any>();
  graphRendered(){
    this.subject.next(true);
  }
  graphObserver():Observable<any>{
    return this.subject.asObservable();
  }
}
