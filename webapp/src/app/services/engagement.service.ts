import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import {EngagementMetrics} from '../pages/components/Dashboards/engagement-dashboard/state/engagement.models';

@Injectable({
  providedIn: 'root'
})
export class EngagementService {
  private API_URL = environment.API_URL;

  constructor(private http: HttpClient) {}

  /**
   * Get user engagement metrics for a specific course
   */
  getUserEngagementMetrics(userId: string, courseId: string): Observable<EngagementMetrics> {
    return this.http.get<EngagementMetrics>(
      `${this.API_URL}/engagement/user/${userId}/course/${courseId}/metrics`
    );
  }

  /**
   * Get peer activities data
   */
  getPeerActivities(courseId: string): Observable<any> {
    return this.http.get<any>(
      `${this.API_URL}/engagement/peer-activities?courseId=${courseId}`
    );
  }

  /**
   * Get same engagement level statistics (average and maximum)
   */
  getSameEngagementLevelStats(userId: string, courseId: string): Observable<any> {
    return this.http.get<any>(
      `${this.API_URL}/engagement/user/${userId}/course/${courseId}/same-level-stats`
    );
  }

  /**
   * Get annotation activity details
   */
  getAnnotationActivityDetails(userId: string, courseId: string, category: string = 'all'): Observable<any> {
    return this.http.get<any>(
      `${this.API_URL}/engagement/user/${userId}/course/${courseId}/annotation-activities?category=${category}`
    );
  }

  /**
   * Get knowledge graph activity details
   */
  getKGActivityDetails(userId: string, courseId: string, category: string = 'all'): Observable<any> {
    return this.http.get<any>(
      `${this.API_URL}/engagement/user/${userId}/course/${courseId}/kg-activities?category=${category}`
    );
  }

  /**
   * Get higher engagement level boundaries
   */
  getHigherEngagementLevelBoundaries(userId: string, courseId: string): Observable<any> {
    return this.http.get<any>(
      `${this.API_URL}/engagement/user/${userId}/course/${courseId}/higher-level-boundaries`
    );
  }

  /**
   * Get recommendation activity details
   */
  getRecommendationActivityDetails(userId: string, courseId: string, category: string = 'all'): Observable<any> {
    return this.http.get<any>(
      `${this.API_URL}/engagement/user/${userId}/course/${courseId}/recommendation-activities?category=${category}`
    );
  }

  /**
   * Get access activity details
   */
  getAccessActivityDetails(userId: string, courseId: string, category: string = 'all'): Observable<any> {
    return this.http.get<any>(
      `${this.API_URL}/engagement/user/${userId}/course/${courseId}/access-activities?category=${category}`
    );
  }
}

