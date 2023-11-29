import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserServiceService } from './user-service.service';
import { HTTPOptions } from '../config/config';
import { Observable, lastValueFrom } from 'rxjs';
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
    this.userUpdateConcepts = this.http.post<any>(
      `${this.backendEndpointURL}/users/user-concepts`,
      body,
    );
    return this.userUpdateConcepts;
  }
}
