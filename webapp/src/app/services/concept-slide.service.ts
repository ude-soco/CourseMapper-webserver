import { Injectable } from '@angular/core';
import { environment_Python } from 'src/environments/environment';
import { HTTPOptions } from '../config/config';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ConceptSlideService {
  cmEndpointURL = environment_Python.PYTHON_SERVER
  SlideKG:any
  httpHeader=HTTPOptions.headers

  constructor(private http: HttpClient,) { }

  async getConceptMapDataSlide(formData: any): Promise<any> {
      // return this.http.post<any>(`${this.cmEndpointURL}concept-slide`, formData, { headers: this.authenticationService.getHTTPHeaders() }).toPromise();
      const slideKG$= this.http.post<any>(`${this.cmEndpointURL}concept-slide`, formData,{headers:this.httpHeader});
      this.SlideKG = await lastValueFrom(slideKG$)
      return this.SlideKG
  }
}
