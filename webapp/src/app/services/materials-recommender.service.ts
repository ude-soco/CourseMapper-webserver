import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject, lastValueFrom } from 'rxjs';
import { environment_Python } from 'src/environments/environment';
import { HTTPOptions } from '../config/config';

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

  getRecommendedMaterials(formData: any): Observable<any> {
    this.recommendedMaterials = this.http.post<any>(`${this.cmEndpointURL}get_resources`, formData, { withCredentials: true });
    return this.recommendedMaterials
  }


  async rateRecommendedMaterials(formData: any): Promise<any> {
    const recommendedMaterialsRating$ = this.http.post<any>(`${this.cmEndpointURL}rating`, formData, { withCredentials: true });
    this.recommendedMaterialsRating = await lastValueFrom(recommendedMaterialsRating$)
    return this.recommendedMaterialsRating
  }
}