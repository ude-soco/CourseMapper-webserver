import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HTTPOptions } from '../config/config';
import { ResourcesPagination, RatingResource, UserResourceFilterParamsResult, UserResourceFilterResult, Concept } from '../models/croForm';

@Injectable({
  providedIn: 'root'
})
export class MaterialsRecommenderService {
  apiURL = environment.API_URL
  api_PYTHON_SERVER_RS = environment.PYTHON_SERVER_RS
  recommendedConcepts: any
  recommendedMaterials: any
  recommendedMaterialsRating: any

  constructor(private http: HttpClient) {}

  // getRecommendedConcepts(data: any): Observable<any> {
  //   this.recommendedConcepts = this.http.post<any>(`${this.api_PYTHON_SERVER_RS}/courses/${data.courseId}/materials/${data.materialId}/concept-recommendation`, data, HTTPOptions);
  //   return this.recommendedConcepts
  // }

  // getRecommendedMaterials(data: any): Observable<any> {
  //   this.recommendedMaterials = this.http.post<any>(`${this.api_PYTHON_SERVER_RS}/courses/${data.courseId}/materials/${data.materialId}/resource-recommendation`, data, HTTPOptions);
  //   return this.recommendedMaterials
  // }

  // async rateRecommendedMaterials2(data: any): Promise<any> {
  //   const recommendedMaterialsRating$ = this.http.post<any>(`${this.apiURL}/knowledge-graph/rating`, data, HTTPOptions);
  //   this.recommendedMaterialsRating = await lastValueFrom(recommendedMaterialsRating$)
  //   return this.recommendedMaterialsRating
  // }

  getRecommendedConcepts(data: any): Observable<any> {
    this.recommendedConcepts = this.http.post<any>(`${this.api_PYTHON_SERVER_RS}/get_concepts`, data, HTTPOptions);
    return this.recommendedConcepts
  }

  getRecommendedMaterials(data: any): Observable<any> {
    this.recommendedMaterials = this.http.post<any>(`${this.api_PYTHON_SERVER_RS}/get_resources`, data, HTTPOptions);
    return this.recommendedMaterials
  }

  async rateRecommendedMaterials(formData: any): Promise<RatingResource> {
    const recommendedMaterialsRating$ = this.http.post<RatingResource>(`${this.api_PYTHON_SERVER_RS}/rating/resource`, formData, { withCredentials: true });
    this.recommendedMaterialsRating = await lastValueFrom(recommendedMaterialsRating$)
    return this.recommendedMaterialsRating
  }

  SaveOrRemoveUserResource(data: any): Observable<any> {
    //return this.http.post<any>(`${this.api_PYTHON_SERVER_RS}/user_resources/save_or_remove`, data, { withCredentials: true });
    const response$ = this.http.post<any>(
      `${environment.API_URL}/recommendation/rating`,
      data,
      HTTPOptions
    );
    return response$;
  }

  filterUserResourcesSavedBy(data: any): Observable<UserResourceFilterResult> {
    return this.http.post<UserResourceFilterResult>(`${this.api_PYTHON_SERVER_RS}/user_resources/filter`, data, { withCredentials: true });
  }

  getRidsFromUserSaves(user_id: string): Observable<[]> {
    return this.http.get<[]>(`${this.api_PYTHON_SERVER_RS}/user_resources/get_rids_from_user_saves?user_id=${user_id}`, { withCredentials: true });
  }

  getConceptsModifiedByUserFromSaves(user_id: string): Observable<Concept[]> {
    const url = `${this.api_PYTHON_SERVER_RS}/setting/get_concepts_modified_by_user_from_saves?user_id=${user_id}`;
    return this.http.get<Concept[]>(url);
  }
}
