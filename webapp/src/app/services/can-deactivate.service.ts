import { Injectable } from '@angular/core';
import { CanDeactivate } from '@angular/router';
import { Observable } from 'rxjs';
import { CanComponentDeactivate } from '../course-welcome/course-welcome.component';


@Injectable({
  providedIn: 'root'
})
export class CanDeactivateService implements  CanDeactivate<CanComponentDeactivate>{
  canDeactivate(
    component: CanComponentDeactivate
  ): boolean | Observable<boolean> {
    return component.canDeactivate();
  }

  //constructor() { }
}
