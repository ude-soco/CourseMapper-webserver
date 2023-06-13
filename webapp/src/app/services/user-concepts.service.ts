import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { UserServiceService } from './user-service.service';
import { HTTPOptions } from '../config/config';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UserConceptsService {
  backendEndpointURL = environment.apiUrl;
  httpHeader = HTTPOptions.headers;
  userConcepts: any;
  userUpdateConcepts: any;

  constructor(private http: HttpClient) {}
  async getUserConcepts(userID: string): Promise<any> {
    // return this.http
    // .get<any>(`${this.backendEndpointURL}user-concepts/${userID}`,
    //   { headers: this.authenticatioNService.getHTTPHeaders() })
    // .toPromise().catch((err:HttpErrorResponse)=>{console.error('An error occurred:', err.error);});
    console.log(`${this.backendEndpointURL}/users/user-concepts/${userID}`)
    const userConcepts$ = this.http.get<any>(
      `${this.backendEndpointURL}/users/user-concepts/${userID}`,
      { headers: this.httpHeader }
    );
    this.userConcepts = await lastValueFrom(userConcepts$);
    console.log(this.userConcepts)
    return this.userConcepts;
  }

  async updateUserConcepts(
    userID: string,
    understoodConcepts: string[],
    didNotUnderstandConcepts: string[]
  ): Promise<any> {
    let body = {
      userId: userID,
      understoodConcepts: understoodConcepts,
      didNotUnderstandConcepts: didNotUnderstandConcepts,
    };
    // return this.http
    // .post<any>(`${this.backendEndpointURL}user-concepts`, body, {
    //   headers: this.authenticatioNService.getHTTPHeaders(),
    // })
    // .toPromise();
    const userUpdateConcepts$ = this.http.post<any>(
      `${this.backendEndpointURL}/users/user-concepts`,
      body,
      // HTTPOptions
    );
    this.userUpdateConcepts = await lastValueFrom(userUpdateConcepts$);
    return this.userUpdateConcepts;
  }
}
