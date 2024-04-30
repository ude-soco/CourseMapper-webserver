import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VisSelectedPlatformsCompareService {
  private selectedPlatformsSubject = new BehaviorSubject<string[]>([]);

  setSelectedPlatforms(platforms: string[]) {
    this.selectedPlatformsSubject.next(platforms);
  }

  getSelectedPlatforms() {
    return this.selectedPlatformsSubject.asObservable();
  }

  constructor() { }
}
