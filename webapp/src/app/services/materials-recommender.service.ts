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
  logWikiArticleView(data: {
    articleTitle: string;
    articleUrl: string;
  }): Observable<any> {
    return this.http.post<any>(
      `${this.apiURL}/articles/${data.articleTitle}/log`,
      data,
      HTTPOptions
    );
  }
}
