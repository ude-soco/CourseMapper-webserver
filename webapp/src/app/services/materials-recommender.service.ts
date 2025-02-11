import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { HTTPOptions } from '../config/config';
@Injectable({
  providedIn: 'root',
})
export class MaterialsRecommenderService {
  apiURL = environment.API_URL;
  recommendedConcepts: any;
  recommendedMaterials: any;
  recommendedMaterialsRating: any;

  constructor(private http: HttpClient) {}

  getRecommendedConcepts(data: any): Observable<any> {
    this.recommendedConcepts = this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/concept-recommendation`,
      data,
      HTTPOptions
    );
    return this.recommendedConcepts;
  }

  getRecommendedMaterials(data: any): Observable<any> {
    this.recommendedMaterials = this.http.post<any>(
      `${this.apiURL}/courses/${data.courseId}/materials/${data.materialId}/resource-recommendation`,
      data,
      HTTPOptions
    );
    return this.recommendedMaterials;
  }

  async rateRecommendedMaterials(data: any): Promise<any> {
    const recommendedMaterialsRating$ = this.http.post<any>(
      `${this.apiURL}/knowledge-graph/rating`,
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
      `${this.apiURL}/materials/${data.materialId}/recommended-articles/${data.title}/log`,
      data,
      HTTPOptions
    );
  }

  logExpandAbstract(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/materials/${data.materialId}/recommended-article/${data.title}/abstract/log-expand`,
      data,
      HTTPOptions
    );
  }
  logCollapseAbstract(data: any): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/materials/${data.materialId}/recommended-article/${data.title}/abstract/log-collapse`,
      data,
      HTTPOptions
    );
  }

  logMarkAsHelpfulArticle(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-article/${data.title}/mark-helpful`,
        data,
        HTTPOptions
      )
    );
  }
  logMarkAsHelpfulVideo(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-video/${data.title}/mark-helpful`,
        data,
        HTTPOptions
      )
    );
  }

  logMarkAsNotHelpfulArticle(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-article/${data.title}/mark-not-helpful`,
        data,
        HTTPOptions
      )
    );
  }
  logMarkAsNotHelpfulVideo(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-video/${data.title}/mark-not-helpful`,
        data,
        HTTPOptions
      )
    );
  }
  logUnmarkAsHelpfulArticle(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-article/${data.title}/un-mark-helpful`,
        data,
        HTTPOptions
      )
    );
  }
  logUnmarkAsHelpfulVideo(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-video/${data.title}/un-mark-helpful`,
        data,
        HTTPOptions
      )
    );
  }

  logUnmarkAsNotHelpfulArticle(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-article/${data.title}/un-mark-not-helpful`,
        data,
        HTTPOptions
      )
    );
  }
  logUnmarkAsNotHelpfulVideo(data: any): Promise<any> {
    return lastValueFrom(
      this.http.post<any>(
        `${this.apiURL}/materials/${data.materialId}/recommended-video/${data.title}/un-mark-not-helpful`,
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
}
