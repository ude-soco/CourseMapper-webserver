import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, finalize, shareReplay, tap } from 'rxjs';
import { Observable } from 'rxjs/internal/Observable';
import { HTTPOptions } from 'src/app/config/config';
import { CourseRecommendation } from 'src/app/models/CourseRecommendation';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class MoocRecommendationsService {
  apiURL = environment.API_URL;

  private recommendationsRequest$?: Observable<CourseRecommendation[]>; // prevent duplicate in-flight requests

  // recommendations
  private recommendationSubject = new BehaviorSubject<CourseRecommendation[]>([]);
  readonly recommendations$ = this.recommendationSubject.asObservable();

  // loading state
  private loadingSubject = new BehaviorSubject<boolean>(false);
  readonly loading$ = this.loadingSubject.asObservable();

  // error state
  private errorSubject = new BehaviorSubject<string>('');
  readonly error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  normalizeRecommendations(
    result: CourseRecommendation[] = [],
  ): CourseRecommendation[] {
    return result.filter((item) => item && item.name);
  }

  getRecommendedMOOCs(
    data: any = {},
    forceRefresh = false,
  ): Observable<CourseRecommendation[]> {
    this.loadingSubject.next(true);
    this.errorSubject.next(null);

    if(!this.recommendationsRequest$ || forceRefresh)
    this.recommendationsRequest$ = this.http
      .post<
        CourseRecommendation[]
      >(`${this.apiURL}/recommendation/MOOC-recommendation`, data, HTTPOptions)
      .pipe(
        tap({
          next: (items) => this.recommendationSubject.next(items),
          error: (error) =>
            this.errorSubject.next(
              error.message || 'Failed to load recommendations.',
            ),
        }),
        finalize(() => {
          this.loadingSubject.next(false);
          // delete request once completed so next request is new and recommendations are fresh each time
          this.recommendationsRequest$ = undefined; 
        }),
        shareReplay({ bufferSize: 1, refCount: true }),
      );

      return this.recommendationsRequest$;
  }
}
