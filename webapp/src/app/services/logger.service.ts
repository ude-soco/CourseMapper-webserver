import { environment } from './../../environments/environment';
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, Subject, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class LoggerService {
  private API_URL = environment.API_URL;

  constructor(private http: HttpClient) { }

  videoPlayed(courseId, materialId, hours, minutes, seconds) {
    return this.http.get<any>(`${this.API_URL}/courses/${courseId}/materials/${materialId}/${hours}/${minutes}/${seconds}/video/play`)
    .pipe(
      catchError(( err, sourceObservable) => {
       if (err.status ===  403 || err.status ===  406) {
        return of({errorMsg: err.error.error });
       }else {
        return of({errorMsg: "Error in connection: Please reload the application" })
       }
    })).subscribe();
  }

  videoPuased(courseId, materialId, hours, minutes, seconds){
    return this.http.get<any>(`${this.API_URL}/courses/${courseId}/materials/${materialId}/${hours}/${minutes}/${seconds}/video/pause`)
    .pipe(
      catchError(( err, sourceObservable) => {
       if (err.status ===  403 || err.status ===  406 ) {
        return of({errorMsg: err.error.error });
       }else {
        return of({errorMsg: "Error in connection: Please reload the application" })
       }
    })).subscribe();
  }

  videoCompleted(courseId, materialId){
    return this.http.get<any>(`${this.API_URL}/courses/${courseId}/materials/${materialId}/video/complete`)
    .pipe(
      catchError(( err, sourceObservable) => {
       if (err.status ===  403 || err.status ===  406 ) {
        return of({errorMsg: err.error.error });
       }else {
        return of({errorMsg: "Error in connection: Please reload the application" })
       }
    })).subscribe();
  }

  slideSeen(courseId, materialId, slideNr){
    return this.http.get<any>(`${this.API_URL}/courses/${courseId}/materials/${materialId}/pdf/slide/${slideNr}/view`)
    .pipe(
      catchError(( err, sourceObservable) => {
       if (err.status ===  403 || err.status ===  406 ) {
        return of({errorMsg: err.error.error });
       }else {
        return of({errorMsg: "Error in connection: Please reload the application" })
       }
    })).subscribe();
  }

  pdfCompleted(courseId, materialId){
    return this.http.get<any>(`${this.API_URL}/courses/${courseId}/materials/${materialId}/pdf/complete`)
    .pipe(
      catchError(( err, sourceObservable) => {
       if (err.status ===  403 || err.status ===  406 ) {
        return of({errorMsg: err.error.error });
       }else {
        return of({errorMsg: "Error in connection: Please reload the application" })
       }
    })).subscribe();
  }

}
