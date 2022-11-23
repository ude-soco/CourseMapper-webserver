import { Indicator } from './../models/Indicator';
import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, Subject, tap } from 'rxjs';
import { CourseService } from './course.service';

@Injectable({
  providedIn: 'root',
})
export class IndicatorService {
  private API_URL = environment.API_URL;
  private indicators: Indicator[] = [];
  onUpdateIndicators$ = new Subject<Indicator[]>();

  constructor(private http: HttpClient, private courseService: CourseService) {}

  fetchIndicators(): Observable<Indicator[]> {
    const courseId = this.courseService.getSelectedCourse()._id;
    return this.http
      .get<Indicator[]>(`${this.API_URL}/courses/${courseId}/indicators`)
      .pipe(
        tap((indicators) => {
          this.indicators = indicators;
        })
      );
  }

  addNewIndicator(indicator): Observable<Indicator> {
    const courseId = this.courseService.getSelectedCourse()._id;
    return this.http
      .post<any>(`${this.API_URL}/courses/${courseId}/indicator`, indicator)
      .pipe(
        catchError((err, sourceObservable) => {
          if (err.status === 404) {
            return of({ errorMsg: err.error.error });
          } else {
            return of({
              errorMsg: 'Error in connection: Please reload the application',
            });
          }
        }),
        tap((res) => {
          if (!('errorMsg' in res)) {
            this.indicators.push(res.indicator);
            this.onUpdateIndicators$.next(this.indicators);
          }
        })
      );
  }

  deleteIndicator(indicatorTD: Indicator, courseId) {
    return this.http
      .delete<any>(
        `${this.API_URL}/courses/${courseId}/indicator/${indicatorTD._id}`
      )
      .pipe(
        catchError((errResponse, sourceObservable) => {
          if (errResponse.status === 404) {
            return of({ errorMsg: errResponse.error.error });
          } else {
            return of({
              errorMsg: 'Error in connection: Please reload the application',
            });
          }
        }),
        tap((res) => {
          if (!('errorMsg' in res)) {
            this.indicators = this.indicators.filter(
              (indicator) =>
                indicator._id.toString() !== indicatorTD._id.toString()
            );
            this.onUpdateIndicators$.next(this.indicators);
          }
        })
      );
  }

  updateIndicator(updatedindicator, courseId) {
    return this.http
      .put<any>(
        `${this.API_URL}/courses/${courseId}/indicator/${updatedindicator._id}/${updatedindicator.width}/${updatedindicator.height}`,
        {}
      )
      .pipe(
        catchError((errResponse, sourceObservable) => {
          if (errResponse.status === 404) {
            return of({ errorMsg: errResponse.error.error });
          } else {
            return of({
              errorMsg: 'Error in connection: Please reload the application',
            });
          }
        }),
        tap((res) => {
          if (!('errorMsg' in res)) {
            this.indicators.forEach((indicator) => {
              if (
                indicator._id.toString() === updatedindicator._id.toString()
              ) {
                indicator = updatedindicator;
              }
            });
            this.onUpdateIndicators$.next(this.indicators);
          }
        })
      );
  }
}
