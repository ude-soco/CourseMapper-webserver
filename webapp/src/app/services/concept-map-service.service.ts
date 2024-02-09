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

  async getConceptMapData(data: any): Promise<any> {
    const MaterialKG$ = this.http.post<any>(
      `${environment.API_URL}/courses/${data.courseId}/materials/${data.materialId}/concept-map`,
      data,
      HTTPOptions
    );
    const MaterialKG = await lastValueFrom(MaterialKG$);
    return MaterialKG;
  }
}
