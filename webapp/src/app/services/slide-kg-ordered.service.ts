import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class SlideKgOrderedService {
  private subject = new Subject<any>();
  slideKgOrdered(){
    this.subject.next(true);
  }
  generateSlideKG():Observable<any>{
    return this.subject.asObservable();
  }
}
