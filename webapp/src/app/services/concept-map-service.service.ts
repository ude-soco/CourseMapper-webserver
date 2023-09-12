import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { environment_Python } from 'src/environments/environment';
import { HTTPOptions } from '../config/config';
@Injectable({
  providedIn: 'root',
})
export class ConceptMapService {
  cmEndpointURL = environment_Python.PYTHON_SERVER;
  MaterialKG: any;
  // httpHeader={headers: new HttpHeaders({"Authorization": `Bearer ${this.jwt}`})}
  // httpHeader = HTTPOptions.headers;
  httpHeader : {"Access-Control-Allow-Credentials", true};

  // constructor(private http: HttpClient, private authenticationService: AuthenticationService) { }
  constructor(private http: HttpClient) {}

  getConceptMapData(formData: any): Observable<any> {
    this.MaterialKG = this.http.post<any>(
      `${this.cmEndpointURL}concept-map`,
      formData,
      // { headers: this.httpHeader }
      // { headers: this.httpHeader }
      { withCredentials: true }
    );
    return this.MaterialKG;
    // return this.http.post<any>(`${this.cmEndpointURL}concept-map`, formData, { headers: this.authenticationService.getHTTPHeaders() }).toPromise();
  }
}
