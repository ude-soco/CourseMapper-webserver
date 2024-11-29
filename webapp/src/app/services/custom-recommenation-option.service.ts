import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, lastValueFrom } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Neo4jResult, FactorWeight } from '../models/croForm';
import { HTTPOptions } from '../config/config';
// TODO remove neo4j from package.json

// type Neo4jResult = {
//   records: any[]
// }

@Injectable({
  providedIn: 'root'
})
export class CustomRecommendationOptionService {
  api_PYTHON_SERVER_RS = environment.PYTHON_SERVER_RS;
  LEAF_URL = `${environment.API_URL}/recommendation/setting`;

  constructor(public router: Router, private http: HttpClient) { }

  // updateFactorWeight(data): Observable<any>{
  //   const url = `${this.LEAF_URL}/update_factor_weights`;
  //   return this.http.post<any>(url, data, HTTPOptions);
  // }

  getConceptsModifiedByUserIdAndMid(mid: string, user_id: string): Observable<Neo4jResult> {
    const url = `${this.LEAF_URL}/get_concepts_modified_by_user_id_and_mid?user_id=${user_id}&mid=${mid}`;
    return this.http.get<Neo4jResult>(url);
  }

  getConceptsModifiedByUserId(user_id: string): Observable<Neo4jResult> {
    const url = `${this.LEAF_URL}/get_concepts_modified_by_user_id?user_id=${user_id}`;
    return this.http.get<Neo4jResult>(url);
  }

  getConceptsByCids(user_id: string, cids: string): Observable<Neo4jResult> {
    const url = `${this.LEAF_URL}/get_concepts_by_cids?user_id=${user_id}&cids=${cids}`;
    return this.http.get<Neo4jResult>(url);
  }
}