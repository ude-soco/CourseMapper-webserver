import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class PlatformFilterCompareService {
  private languageFilterSubject = new BehaviorSubject<string[]>([]);

  setLanguageFilter(languages: string[]) {
    this.languageFilterSubject.next(languages);
  }

  getLanguageFilter() {
    return this.languageFilterSubject.asObservable();
  }

  constructor() { }
}
