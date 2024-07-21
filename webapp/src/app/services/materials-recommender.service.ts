import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, lastValueFrom } from 'rxjs';
import { environment_Python } from 'src/environments/environment';
import { HTTPOptions } from '../config/config';
import { ResourcesPagination, RatingResource, UserResourceFilterParamsResult, UserResourceFilterResult } from '../models/croForm';

@Injectable({
  providedIn: 'root'
})
export class MaterialsRecommenderService {
  cmEndpointURL = environment_Python.PYTHON_SERVER
  httpHeader = HTTPOptions.headers
  recommendedConcepts: any
  recommendedMaterials: any
  recommendedMaterialsRating: any

  public materialModel = new Subject<string>();
  private commonMaterialModel = ''

  public materialModelUpdate1 = new Subject<any[]>();
  private commonMaterialModelUpdate1 = []
  public materialModelUpdate2 = new Subject<any[]>();
  private commonMaterialModelUpdate2 = []
  public materialModelUpdate3 = new Subject<any[]>();
  private commonMaterialModelUpdate3 = []
  public materialModelUpdate4 = new Subject<any[]>();
  private commonMaterialModelUpdate4 = []

  constructor(private http: HttpClient,) {
    this.materialModel = new Subject();
    this.materialModelUpdate1 = new Subject();
  }

  getRecommendedConcepts(formData: any): Observable<any> {
    this.recommendedConcepts = this.http.post<any>(`${this.cmEndpointURL}get_concepts`, formData, { withCredentials: true });
    return this.recommendedConcepts
  }

  getRecommendedMaterials(formData: any, croForm: any): Observable<ResourcesPagination> {
    let data = {default: {}, rec_params: croForm};

    if (formData !== null) {
      for (const p of formData) {
        data["default"][String(p[0])] = p[1]
      }
    } else {
      data["default"] = null;
    }

    console.warn("getRecommendedMaterials ->");
    console.warn("data ->", data);
    // return null;

    this.recommendedMaterials = this.http.post<ResourcesPagination>(`${this.cmEndpointURL}get_resources`, data, { withCredentials: true });
    return this.recommendedMaterials
  }

  async rateRecommendedMaterials(formData: any): Promise<RatingResource> {
    const recommendedMaterialsRating$ = this.http.post<RatingResource>(`${this.cmEndpointURL}rating`, formData, { withCredentials: true });
    this.recommendedMaterialsRating = await lastValueFrom(recommendedMaterialsRating$)
    return this.recommendedMaterialsRating
  }

  SaveOrRemoveUserResource(data: any): Observable<any> {
    return this.http.post<any>(`${this.cmEndpointURL}user_resources/save_or_remove`, data, { withCredentials: true });
  }

  filterUserResourcesSavedBy(data: any): Observable<UserResourceFilterResult> {
    return this.http.post<UserResourceFilterResult>(`${this.cmEndpointURL}user_resources/filter`, data, { withCredentials: true });
  }


  /*
    getConceptsMidsSliderNumbersForUserResourcesFiltering(data: any): Observable<UserResourceFilterParamsResult> {
    return this.http.post<UserResourceFilterParamsResult>(`${this.cmEndpointURL}user_resources/get_filter_params`, data, { withCredentials: true });
  }
  */

  // getRecommendedMaterials(formData: any, croForm: any): Observable<any> {
  //   let data = {default: {}, croForm: croForm};

  //   for (const p of formData) {
  //     data["default"][String(p[0])] = p[1]
  //   }
  //   console.warn("data ->", data);

  //   this.recommendedMaterials = this.http.post<any>(`${this.cmEndpointURL}get_resources`, data, { withCredentials: true });
  //   return this.recommendedMaterials
  // }
}
