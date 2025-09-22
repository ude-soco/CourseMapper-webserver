import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, lastValueFrom, BehaviorSubject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Neo4jResult } from '../models/croForm';
import { HTTPOptions } from '../config/config';


@Injectable({
  providedIn: 'root'
})
export class CustomRecommendationOptionService {
  LEAF_URL = `${environment.API_URL}/recommendation/setting`;

  constructor(public router: Router, private http: HttpClient) { }

  private isResultTabSubject = new BehaviorSubject<string>(null);
  public isResultTabSelected$ = this.isResultTabSubject.asObservable();

  public setResultaTabValue(value: string) {
    this.isResultTabSubject.next(value);
  }

  getConceptsModifiedByUserIdAndMid(mid: string, user_id: string): Observable<Neo4jResult> {
    return this.http.get<Neo4jResult>(`${this.LEAF_URL}/get_concepts_modified_by_user_id_and_mid?user_id=${user_id}&mid=${mid}`);
  }

  getConceptsModifiedByUserId(user_id: string): Observable<Neo4jResult> {
    return this.http.get<Neo4jResult>(`${this.LEAF_URL}/get_concepts_modified_by_user_id?user_id=${user_id}`);
  }

  getConceptsByCids(user_id: string, cids: string): Observable<Neo4jResult> {
    return this.http.get<Neo4jResult>(`${this.LEAF_URL}/get_concepts_by_cids?user_id=${user_id}&cids=${cids}`);
  }
}