import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HTTPOptions } from '../config/config';
import { ResourcesPagination, RatingResource, UserResourceFilterParamsResult, UserResourceFilterResult, Concept } from '../models/croForm';


@Injectable({
  providedIn: 'root',
})
export class MaterialsRecommenderService {
  apiURL = environment.API_URL
  recommendedConcepts: any
  recommendedMaterials: any
  recommendedMaterialsRating: any
  LEAF_URL = `${environment.API_URL}/recommendation`;

  constructor(private http: HttpClient) {}


  getRecommendedConcepts(data: any): Observable<any> {
    this.recommendedConcepts = this.http.post<any>(`${this.LEAF_URL}/get_concepts`, data, HTTPOptions);
    return this.recommendedConcepts
  }

  getRecommendedMaterials(data: any): Observable<any> {
    this.recommendedMaterials = this.http.post<any>(`${this.LEAF_URL}/get_resources`, data, HTTPOptions);
    return this.recommendedMaterials
  }

  getRecommendedConceptsLog(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/concept-recommendation/log`,
      data,
      HTTPOptions
    );
  }

  async rateRecommendedMaterials(data: any): Promise<any> {
    const recommendedMaterialsRating$ = this.http.post<any>(
      `${this.LEAF_URL}/rating_resource`,
      data,
      HTTPOptions
    );
    this.recommendedMaterialsRating = await lastValueFrom(
      recommendedMaterialsRating$
    );
    return this.recommendedMaterialsRating;
  }

  logWikiArticleView(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/materials/${data.materialId}/recommended-articles/log`,
      data,
      HTTPOptions
    );
  }

  logExpandAbstract(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/materials/${data.materialId}/recommended-article/abstract/log-expand`,
      data,
      HTTPOptions
    );
  }
  logCollapseAbstract(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/materials/${data.materialId}/recommended-article/abstract/log-collapse`,
      data,
      HTTPOptions
    );
  }

  logMarkAsHelpfulArticle(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-article/mark-helpful`,
        data,
        HTTPOptions
      )
    );
  }
  logMarkAsHelpfulVideo(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-video/${data.resourceId}/mark-helpful`,
        data,
        HTTPOptions
      )
    );
  }

  logMarkAsNotHelpfulArticle(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-article/mark-not-helpful`,
        data,
        HTTPOptions
      )
    );
  }
  logMarkAsNotHelpfulVideo(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-video/${data.resourceId}/mark-not-helpful`,
        data,
        HTTPOptions
      )
    );
  }
  logUnmarkAsHelpfulArticle(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-article/un-mark-helpful`,
        data,
        HTTPOptions
      )
    );
  }
  logUnmarkAsHelpfulVideo(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-video/${data.resourceId}/un-mark-helpful`,
        data,
        HTTPOptions
      )
    );
  }

  logUnmarkAsNotHelpfulArticle(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-article/un-mark-not-helpful`,
        data,
        HTTPOptions
      )
    );
  }
  logUnmarkAsNotHelpfulVideo(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-video/${data.resourceId}/un-mark-not-helpful`,
        data,
        HTTPOptions
      )
    );
  }
  logViewRecommendedVideos(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-videos/view-all`,
        data,
        HTTPOptions
      )
    );
  }
  logViewRecommendedArticles(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-articles/view-all`,
        data,
        HTTPOptions
      )
    );
  }

  SaveOrRemoveUserResource(data: any): Observable<any> {
    return this.http.post<any>(`${this.LEAF_URL}/save_or_remove_resources`, data, { withCredentials: true });
  }

  getConceptsModifiedByUserFromSaves(user_id: string): Observable<Concept[]> {
    const url = `${this.LEAF_URL}/setting/get_concepts_modified_by_user_from_saves?user_id=${user_id}`;
    return this.http.get<Concept[]>(url);
  }

  filterUserResourcesSavedBy(data: any): Observable<UserResourceFilterResult> {
    return this.http.post<UserResourceFilterResult>(
      `${this.LEAF_URL}/user_resources/filter`,
      data,
      HTTPOptions
    );
  }

  getRidsFromUserSaves(user_id: string): Observable<[]> {
    return this.http.get<[]>(
      `${this.LEAF_URL}/user_resources/get_rids_from_user_saves?user_id=${user_id}`,
      HTTPOptions
    );
  }

}