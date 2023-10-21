import { Indicator } from './../models/Indicator';
import { Injectable } from '@angular/core';
import { environment } from './../../environments/environment';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, Subject, tap } from 'rxjs';
import { CourseService } from './course.service';
import { MaterilasService } from './materials.service';
import { TopicChannelService } from './topic-channel.service';

@Injectable({
  providedIn: 'root',
})
export class IndicatorService {
  private API_URL = environment.API_URL;
  private indicators: Indicator[] = [];
  onUpdateIndicators$ = new Subject<Indicator[]>();
  onUpdateUserIndicators$ = new Subject<Indicator[]>();
  onUpdateMaterialIndicators$ = new Subject<Indicator[]>();
  onUpdateChannelIndicators$ = new Subject<Indicator[]>();
  onUpdateTopicIndicators$ = new Subject<Indicator[]>();


  constructor(private http: HttpClient,
     private courseService: CourseService,
     private topicService: TopicChannelService,
     private materialService: MaterilasService) {}

  fetchIndicators(courseId): Observable<Indicator[]> {
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

  reorderIndicators(sourseIndex, targetIndex, courseId) {
    return this.http
      .put<any>(
        `${this.API_URL}/courses/${courseId}/reorder/${targetIndex}/${sourseIndex}`,
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
            this.indicators = res.indicators;
            this.onUpdateIndicators$.next(this.indicators);
          }
        })
      );
  }

  updateIndicator(updatedindicator, courseId) {
    return this.http
      .put<any>(
        `${this.API_URL}/courses/${courseId}/indicator/${updatedindicator._id}/resize/${updatedindicator.width}/${updatedindicator.height}`,
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

  fetchUserIndicators(): Observable<Indicator[]> {
    const url = `${this.API_URL}/user/indicators`;
    return this.http.get<Indicator[]>(url).pipe(
      tap((indicators) => {
        this.indicators = indicators;
      })
    );
  }

  addNewUserIndicator(indicator): Observable<Indicator> {
    const url = `${this.API_URL}/user/indicator`;
    return this.http.post<any>(url, indicator).pipe(
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
          this.onUpdateUserIndicators$.next(this.indicators);
        }
      })
    );
  }

  deleteUserIndicator(indicatorId: string) {
    const url = `${this.API_URL}/user/indicator/${indicatorId}`;
    return this.http.delete<any>(url).pipe(
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
            (indicator) => indicator._id.toString() !== indicatorId.toString()
          );
          this.onUpdateUserIndicators$.next(this.indicators);
        }
      })
    );
  }

  reorderUserIndicators(sourseIndex, targetIndex) {
    const url = `${this.API_URL}/user/reorder/${targetIndex}/${sourseIndex}`;
    return this.http.put<any>(url, {}).pipe(
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
          this.indicators = res.indicators;
          this.onUpdateUserIndicators$.next(this.indicators);
        }
      })
    );
  }

  // "/api/user/indicator/:indicatorId/resize/:width/:height",
  updateUserIndicator(updatedindicator) {
    const url = `${this.API_URL}/user/indicator/${updatedindicator._id}/resize/${updatedindicator.width}/${updatedindicator.height}`;
    return this.http.put<any>(url, {}).pipe(
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
            if (indicator._id.toString() === updatedindicator._id.toString()) {
              indicator = updatedindicator;
            }
          });
          this.onUpdateUserIndicators$.next(this.indicators);
        }
      })
    );
  }

  addNewMaterialIndicator(materialId, indicator): Observable<Indicator> {
    const courseId = this.courseService.getSelectedCourse()._id;
    const url = `${this.API_URL}/courses/${courseId}/materials/${materialId}/indicator`;
    console.log(url);
    return this.http.post<any>(url, indicator).pipe(
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
          this.onUpdateMaterialIndicators$.next(this.indicators);
        }
      })
    );
  }

  fetchMaterialIndicators(materialId, courseId): Observable<Indicator[]> {
    const url = `${this.API_URL}/courses/${courseId}/materials/${materialId}/indicator`;
    return this.http.get<Indicator[]>(url).pipe(
      tap((indicators) => {
        this.indicators = indicators;
      })
    );
  }

  deleteMaterialIndicator(indicatorId: string, materialId: string) {
    const courseId = this.courseService.getSelectedCourse()._id;
    const url = `${this.API_URL}/courses/${courseId}/materials/${materialId}/indicator/${indicatorId}`;
    return this.http
      .delete<any>(
       url
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
                indicator._id.toString() !== indicatorId.toString()
            );
            this.onUpdateMaterialIndicators$.next(this.indicators);
          }
        })
      );
  }

  //"/api/courses/:courseId/materials/:materialId/indicator/:indicatorId/resize/:width/:height",
  updateMaterialIndicator(updatedindicator: Indicator, materialId) {
    const courseId = this.courseService.getSelectedCourse()._id;
    this.courseService.getSelectedCourse().role;
    const indicatorId = updatedindicator._id;
    const width = updatedindicator.width;
    const height = updatedindicator.height;
  
    const url = `${this.API_URL}/courses/${courseId}/materials/${materialId}/indicator/${indicatorId}/resize/${width}/${height}`;
    return this.http.put<any>(url, {}).pipe(
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
            if (indicator._id.toString() === updatedindicator._id.toString()) {
              indicator = updatedindicator;
            }
          });
          this.onUpdateMaterialIndicators$.next(this.indicators);
        }
      })
    );
  }

  //"/api/courses/:courseId/materials/:materialId/reorder/:newIndex/:oldIndex"
  reorderMaterialIndicators(sourseIndex, targetIndex, materialId) {
    const courseId = this.courseService.getSelectedCourse()._id;
    const url = `${this.API_URL}/courses/${courseId}/materials/${materialId}/reorder/${targetIndex}/${sourseIndex}`;
    return this.http.put<any>(url, {}).pipe(
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
          this.indicators = res.indicators;
          this.onUpdateMaterialIndicators$.next(this.indicators);
        }
      })
    );
  }

 // "/api/courses/:courseId/channels/:channelId/indicator",
  addNewChannelIndicator(channelId, indicator): Observable<Indicator> {
    const courseId = this.courseService.getSelectedCourse()._id;
    const url = `${this.API_URL}/courses/${courseId}/channels/${channelId}/indicator`;
    console.log(url);
    return this.http.post<any>(url, indicator).pipe(
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
          this.onUpdateChannelIndicators$.next(this.indicators);
        }
      })
    );
  }

  fetchChannelIndicators(courseId, channelId): Observable<Indicator[]> {
    //const courseId = this.courseService.getSelectedCourse()._id;
    const url = `${this.API_URL}/courses/${courseId}/channels/${channelId}/indicator`;
    return this.http.get<Indicator[]>(url).pipe(
      tap((indicators) => {
        this.indicators = indicators;
      })
    );
  }
 // "/api/courses/:courseId/channels/:channelId/indicator/:indicatorId",
  deleteChannelIndicator(indicatorId: string, channelId: string) {
    const courseId = this.courseService.getSelectedCourse()._id;
    const url = `${this.API_URL}/courses/${courseId}/channels/${channelId}/indicator/${indicatorId}`;
    return this.http
      .delete<any>(
       url
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
                indicator._id.toString() !== indicatorId.toString()
            );
            this.onUpdateChannelIndicators$.next(this.indicators);
          }
        })
      );
  }

  //"/api/courses/:courseId/channels/:channelId/indicator/:indicatorId/resize/:width/:height",
  updateChannelIndicator(updatedindicator: Indicator, channelId) {
    const courseId = this.courseService.getSelectedCourse()._id;
    this.courseService.getSelectedCourse().role;
    const indicatorId = updatedindicator._id;
    const width = updatedindicator.width;
    const height = updatedindicator.height;
  
    const url = `${this.API_URL}/courses/${courseId}/channels/${channelId}/indicator/${indicatorId}/resize/${width}/${height}`;
    return this.http.put<any>(url, {}).pipe(
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
            if (indicator._id.toString() === indicatorId.toString()) {
              indicator = updatedindicator;
            }
          });
          this.onUpdateChannelIndicators$.next(this.indicators);
        }
      })
    );

  }

  //"/api/courses/:courseId/channels/:channelId/reorder/:newIndex/:oldIndex",
  reorderChannelIndicators(sourseIndex, targetIndex, channelId) {
    const courseId = this.courseService.getSelectedCourse()._id;
    const url = `${this.API_URL}/courses/${courseId}/channels/${channelId}/reorder/${targetIndex}/${sourseIndex}`;
    return this.http.put<any>(url, {}).pipe(
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
          this.indicators = res.indicators;
          this.onUpdateChannelIndicators$.next(this.indicators);
        }
      })
    );
  }

  //"/api/courses/:courseId/topics/:topicId/indicator",
  addNewTopicIndicator( topicId, indicator): Observable<Indicator> {
    const courseId = this.courseService.getSelectedCourse()._id;
    const url = `${this.API_URL}/courses/${courseId}/topics/${topicId}/indicator`;
    console.log(url);
    return this.http.post<any>(url, indicator).pipe(
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
          this.onUpdateTopicIndicators$.next(this.indicators);
        }
      })
    );
  }


  fetchTopicIndicators(courseId, topicId): Observable<Indicator[]> {
    const url = `${this.API_URL}/courses/${courseId}/topics/${topicId}/indicator`;
    return this.http.get<Indicator[]>(url).pipe(
      tap((indicators) => {
        this.indicators = indicators;
      })
    );
  }

  //"/api/courses/:courseId/topics/:topicId/indicator/:indicatorId",
  deleteTopicIndicator(indicatorId: string, courseId: string, topicId: string) {
    //const courseId = this.courseService.getSelectedCourse()._id;
    const url = `${this.API_URL}/courses/${courseId}/topics/${topicId}/indicator/${indicatorId}`;
    return this.http
      .delete<any>(
       url
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
                indicator._id.toString() !== indicatorId.toString()
            );
            this.onUpdateTopicIndicators$.next(this.indicators);
          }
        })
      );
  }

  //"/api/courses/:courseId/topics/:topicId/indicator/:indicatorId/resize/:width/:height",
  updateTopicIndicator(updatedindicator: Indicator, topicId: string) {
    const courseId = this.courseService.getSelectedCourse()._id;
    this.courseService.getSelectedCourse().role;
    const indicatorId = updatedindicator._id;
    const width = updatedindicator.width;
    const height = updatedindicator.height;
  
    const url = `${this.API_URL}/courses/${courseId}/topics/${topicId}/indicator/${indicatorId}/resize/${width}/${height}`;
    return this.http.put<any>(url, {}).pipe(
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
            if (indicator._id.toString() === indicatorId.toString()) {
              indicator = updatedindicator;
            }
          });
          this.onUpdateTopicIndicators$.next(this.indicators);
        }
      })
    );

  }

 // "/api/courses/:courseId/topics/:topicId/reorder/:newIndex/:oldIndex",
  reorderTopicIndicators(sourseIndex, targetIndex, topicId) {
    const courseId = this.courseService.getSelectedCourse()._id;
    const url = `${this.API_URL}/courses/${courseId}/topics/${topicId}/reorder/${targetIndex}/${sourseIndex}`;
    return this.http.put<any>(url, {}).pipe(
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
          this.indicators = res.indicators;
          this.onUpdateTopicIndicators$.next(this.indicators);
        }
      })
    );
  }





}
