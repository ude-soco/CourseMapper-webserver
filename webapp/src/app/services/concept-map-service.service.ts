import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
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

  async getConceptMapData(formData: any): Promise<any> {
    const MaterialKG$ = this.http.post<any>(
      `${this.cmEndpointURL}concept-map`,
      formData,
      // { headers: this.httpHeader }
      // { headers: this.httpHeader }
      { withCredentials: true }
    );
    this.MaterialKG = await lastValueFrom(MaterialKG$);
    console.log(this.MaterialKG)
    return this.MaterialKG;
    // return this.http.post<any>(`${this.cmEndpointURL}concept-map`, formData, { headers: this.authenticationService.getHTTPHeaders() }).toPromise();
  }
}
