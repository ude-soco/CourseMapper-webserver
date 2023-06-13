import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KgTabsActivationService {

  constructor() { }
  private tabsEnable = new Subject<any>();
  kgTabsEnable(){
    this.tabsEnable.next(true);
  }
  activateKgTabs():Observable<any>{
    return this.tabsEnable.asObservable();
  }
}
