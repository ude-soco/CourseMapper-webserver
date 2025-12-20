import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ActivityBreakdown {
  activity_id: string;
  activity_name: string;
  count: number;
  weight: number;
  contribution: number;
}

export interface ConceptInterestData {
  concept_ids: string[];
  raw_score: number;
  normalized_scores: {
    min_max_interpolation: number;
    z_score_k2: number;
    z_score_k3: number;
  };
  activities_breakdown: ActivityBreakdown[];
  total_activity_count: number;
  course_id: string;
  course_name: string;
}

export interface UserInterestData {
  username: string;
  concepts: {
    [conceptName: string]: ConceptInterestData;
  };
}

@Injectable({
  providedIn: 'root'
})
export class InterestLevelService {
  private apiUrl = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Get interest level data for a specific user and concept
   * @param userId User ID
   * @param conceptName Concept name
   * @returns Observable of concept interest data
   */
  getUserConceptInterest(userId: string, conceptName: string): Observable<ConceptInterestData> {
    return this.http.get<ConceptInterestData>(
      `${this.apiUrl}/interest-level/user/${userId}/concept/${encodeURIComponent(conceptName)}`
    );
  }

  /**
   * Get all interest level data for a user
   * @param userId User ID
   * @returns Observable of all user interest data
   */
  getAllUserInterests(userId: string): Observable<UserInterestData> {
    return this.http.get<UserInterestData>(
      `${this.apiUrl}/interest-level/user/${userId}`
    );
  }

  /**
   * Get top concepts by interest score for a user
   * @param userId User ID
   * @param limit Number of concepts to return
   * @returns Observable of top concepts array
   */
  getTopConceptsByInterest(userId: string, limit: number = 10): Observable<Array<{ name: string; score: number; course: string }>> {
    return this.http.get<Array<{ name: string; score: number; course: string }>>(
      `${this.apiUrl}/interest-level/user/${userId}/top-concepts?limit=${limit}`
    );
  }

  /**
   * Get all activities used by a user across all concepts
   * @param userId User ID
   * @returns Observable of activities breakdown
   */
  getAllUserActivities(userId: string): Observable<ActivityBreakdown[]> {
    return this.http.get<ActivityBreakdown[]>(
      `${this.apiUrl}/interest-level/user/${userId}/activities`
    );
  }
}
