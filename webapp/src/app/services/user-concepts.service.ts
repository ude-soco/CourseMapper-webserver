import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserServiceService } from './user-service.service';
import { HTTPOptions } from '../config/config';
import { Observable, lastValueFrom, retry } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserConceptsService {
  backendEndpointURL = environment.API_URL;
  httpHeader = HTTPOptions.headers;
  userConcepts: any;
  userUpdateConcepts: any;

  constructor(private http: HttpClient) {}
  getUserConcepts(userID: string): Observable<any> {
    this.userConcepts = this.http.get<any>(
      `${this.backendEndpointURL}/users/user-concepts/${userID}`,
      { headers: this.httpHeader }
    );
    console.log(this.userConcepts)
    return this.userConcepts;
  }

  // getUserConcepts(userid: string): Observable<any> {
  //   console.log('Making HTTP request for user concepts:', userid);
  //   return this.http.get<any>(`${this.backendEndpointURL}/users/user-concepts/${userid}`, { headers: this.httpHeader })
  //     .pipe(retry(3)); // Retry up to 3 times in case of failures
  // }

  updateUserConcepts(
    userID: string,
    understoodConcepts: string[],
    didNotUnderstandConcepts: string[]
  ): Observable<any> {
    let body = {
      userId: userID,
      understoodConcepts: understoodConcepts,
      didNotUnderstandConcepts: didNotUnderstandConcepts,
    };
  
    return this.http.post<any>(`${this.backendEndpointURL}/users/user-concepts`, body);
  }
  
}
