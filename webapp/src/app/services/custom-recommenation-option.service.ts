import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, lastValueFrom } from 'rxjs';
import { environment_Python } from 'src/environments/environment';
import { Neo4jResult } from '../models/croForm';
// TODO remove neo4j from package.json

// type Neo4jResult = {
//   records: any[]
// }

@Injectable({
  providedIn: 'root'
})
export class CustomRecommendationOptionService {

  constructor(public router: Router, private http: HttpClient) { }

  // async getConceptsByCids(cIds: string[]): Promise<Neo4jResult> {
  //   let params = new URLSearchParams(cIds.map((id) => ['cIds', id]))
  //   return lastValueFrom(this.http.get<Neo4jResult>(
  //     `${environment_Python.PYTHON_SERVER}get_concepts_by_cids?${params.toString()}`
  //   ));
  // }

  getConceptsBYmid(mid: string, user_id: string): Observable<Neo4jResult> {
    const url = `${environment_Python.PYTHON_SERVER}cro_get_concepts_by_user_id_and_mid?user_id=${user_id}&mid=${mid}`;
    return this.http.get<Neo4jResult>(url);
  }

  getConceptsBySlideId(mid: string, user_id: string): Observable<Neo4jResult> {
    const url = `${environment_Python.PYTHON_SERVER}cro_get_concepts_by_user_id_and_slide_id?user_id=${user_id}&slide_id=${mid}`;
    return this.http.get<Neo4jResult>(url);
  }


  /*getConceptsBYuserIdANDmid(userId: string, mid: string): Observable<Neo4jResult> {
    const url = `${environment_Python.PYTHON_SERVER}cro_get_concepts_by_user_id_and_mid?userId=${userId}&mid=${mid}`;
    return this.http.get<Neo4jResult>(url);
  }


  getConceptsByCids(cIds: string[]): Observable<Neo4jResult> {
    let params = new HttpParams();
    params = params.append('cids', cIds.join(', '));

    const url = `${environment_Python.PYTHON_SERVER}get_concepts_by_cids?${cIds.toString()}`;
    return this.http.get<Neo4jResult>(url, { params: params }); // , { observe: 'response' })
  }*/
}