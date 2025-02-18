import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HTTPOptions } from '../config/config';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root',
})
export class ConceptMapService {
  apiURL = environment.API_URL;
  constructor(private http: HttpClient) {}

  async generateConceptMap(courseId: string, materialId: string): Promise<any> {
    const response$ = this.http.post<any>(
      `${environment.API_URL}/courses/${courseId}/materials/${materialId}/concept-map`,
      HTTPOptions
    );
    const response = await lastValueFrom(response$);
    return response;
  }

  async deleteConceptMapConcept(
    courseId: string,
    materialId: string,
    conceptId: string
  ): Promise<any> {
    const response$ = this.http.delete<any>(
      `${environment.API_URL}/courses/${courseId}/materials/${materialId}/concept-map/concepts/${conceptId}`,
      HTTPOptions
    );
    const response = await lastValueFrom(response$);
    return response;
  }

  async addConceptMapConcept(
    courseId: string,
    materialId: string,
    conceptName: string,
    slides: number[]
  ): Promise<any> {
    const response$ = this.http.post<any>(
      `${environment.API_URL}/courses/${courseId}/materials/${materialId}/concept-map/concepts`,
      { conceptName, slides },
      HTTPOptions
    );
    const response = await lastValueFrom(response$);
    return response;
  }

  async expandAndPublishConceptMap(
    courseId: string,
    materialId: string
  ): Promise<any> {
    const response$ = this.http.post<any>(
      `${environment.API_URL}/courses/${courseId}/materials/${materialId}/concept-map/publish`,
      HTTPOptions
    );
    const response = await lastValueFrom(response$);
    return response;
  }

  async searchWikipedia(query: string): Promise<any> {
    const response$ = this.http.get<any>(
      `${environment.API_URL}/wikipedia/search`,
      {
        params: {
          query,
        },
        ...HTTPOptions,
      }
    );
    const response = await lastValueFrom(response$);
    return response;
  }
  logViewFullArticleMKG(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/concepts/${data.node_id}/MKG/view-full-wiki`,
      data
    );
  }
  logViewFullArticleCKG(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/concepts/${data.node_id}/CKG/view-full-wiki`,
      data
    );
  }
  logFilterTopNConcepts(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/KG/filter-top-N`,
      data
    );
  }
  logViewConceptCKG(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/CKG/concepts/${data.concept.id}/log-view`,
      data
    );
  }
  logViewConceptMKG(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/MKG/concepts/${data.concept.id}/log-view`,
      data
    );
  }
  logHidConceptsMKG(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/MKG/log-hide`,
      data
    );
  }
  logUnhidConceptsMKG(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/MKG/log-unhide`,
      data
    );
  }
}
