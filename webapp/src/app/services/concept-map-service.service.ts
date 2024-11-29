import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HTTPOptions } from '../config/config';

@Injectable({
  providedIn: 'root',
})
export class ConceptMapService {
  constructor(private http: HttpClient) {}

  async generateConceptMap(courseId: string, materialId: string): Promise<any> {
    const response$ = this.http.post<any>(
      `${environment.API_URL}/courses/${courseId}/materials/${materialId}/concept-map`,
      HTTPOptions
    );
    const response = await lastValueFrom(response$);
    return response;
  }

  async deleteConceptMapConcept(courseId: string, materialId: string, conceptId: string): Promise<any> {
    const response$ = this.http.delete<any>(
      `${environment.API_URL}/courses/${courseId}/materials/${materialId}/concept-map/concepts/${conceptId}`,
      HTTPOptions
    );
    const response = await lastValueFrom(response$);
    return response;
  }

  async addConceptMapConcept(courseId: string, materialId: string, conceptName: string, slides: number[]): Promise<any> {
    const response$ = this.http.post<any>(
      `${environment.API_URL}/courses/${courseId}/materials/${materialId}/concept-map/concepts`,
      { conceptName, slides },
      HTTPOptions
    );
    const response = await lastValueFrom(response$);
    return response;
  }

  async expandAndPublishConceptMap(courseId: string, materialId: string): Promise<any> {
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
      },
    );
    const response = await lastValueFrom(response$);
    return response;
  }

  async getResourcesByMainConceptsByMid(materialId: string): Promise<any> {
    const response$ = this.http.post<any>(
      `${environment.API_URL}/recommendation/get_resources_by_main_concepts?mid=${materialId}`,
      HTTPOptions
    );
    const response = await lastValueFrom(response$);
    return response;
  }
}
