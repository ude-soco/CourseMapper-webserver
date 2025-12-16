import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'src/environments/environment';
import { InterestConcept, InterestConceptsResponse } from '../pages/components/knowledge-graph/user-pkg/types/interest-level.types';

@Injectable({
  providedIn: 'root',
})
export class PkgService {
  constructor(private http: HttpClient) {}

  /**
   * Get interest concepts for a user
   * Fetches only INTERESTED_IN relationships from Neo4j
   * 
   * @param userId - User ID
   * @param topN - Number of top concepts to return ('All' for all concepts)
   * @returns Observable of InterestConcept array
   */
  getInterestConcepts(userId: string, topN: number | 'All'): Observable<InterestConcept[]> {
    let params = new HttpParams();
    
    if (topN !== 'All') {
      params = params.set('topN', topN.toString());
    }

    return this.http.get<InterestConceptsResponse>(
      `${environment.API_URL}/pkg/${userId}/interests`,
      { params }
    ).pipe(
      map(response => response.concepts)
    );
  }
  
  /**
   * Update (manually adjust) interest score for a user-concept pair
   * This allows users to override calculated scores for better recommendations
   * 
   * @param userId - User ID
   * @param conceptId - Concept ID
   * @param score - New interest score (0-1)
   * @returns Observable with update confirmation
   */
  updateInterestScore(userId: string, conceptId: string, score: number): Observable<any> {
    return this.http.put(
      `${environment.API_URL}/pkg/${userId}/interests/${conceptId}`,
      { score }
    );
  }
}
