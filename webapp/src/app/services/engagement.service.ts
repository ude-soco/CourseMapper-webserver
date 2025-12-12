import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface MaterialDetail {
  id: string;
  name: string;
  channelId: string;
  courseId: string;
  type: string;
}

export interface EngagementMetrics {
  userId: string;
  courseId: string;
  engagementLevel: 'low' | 'medium' | 'high';
  metrics: {
    totalAddedAnnotations: number;
    totalAnnotationsReplied: number;
    totalAnnotationsFollowed: number;
    totalLikesOnAnnotations: number;
    totalDislikesOnAnnotations: number;
    totalAddedTags: number;
    totalTagViewed: number;
    videosStarted: number;
    videosCompleted: number;
    videosPauses: number;
    timeSpentOnVideos: number;
    pdfStarted: number;
    pdfCompleted: number;
    slidesViewed: number;
    slidesNotUnderstood: number;
    // Access metrics
    totalAccesses?: number;
    courseAccesses?: number;
    topicAccesses?: number;
    channelAccesses?: number;
    materialAccesses?: number;
    pdfAccess?: number;
    videoAccess?: number;
    // Dashboard access metrics
    totalDashboardAccesses?: number;
    dashboardCourseAccesses?: number;
    dashboardTopicAccesses?: number;
    dashboardChannelAccesses?: number;
    dashboardMaterialAccesses?: number;
    // Knowledge Graph metrics
    totalKnowledgeGraphAccesses?: number;
    totalKnowledgeGraphConceptViewed?: number;
    totalSlideKnowledgeGraphMarkedUnderstood?: number;
    totalSlideKnowledgeGraphMarkedNotUnderstood?: number;
    totalSlideKnowledgeGraphMarkedAsNew?: number;
    // Recommendation metrics
    totalRecommendedConceptViewed?: number;
    totalRecommendedConceptViewedVisualExplanation?: number;
    totalRecommendedConceptViewedTextualExplanation?: number;
    totalRecommendedMaterialViewed?: number;
    recommendedConceptsMarkedUnderstood?: number;
    recommendedConceptsMarkedNotUnderstood?: number;
    recommendedConceptsMarkedAsNew?: number;
    totalRecommendedMaterialMarkedHelpful?: number;
    totalRecommendedMaterialMarkedNotHelpful?: number;
    // User interaction metrics
    totalUserMentionedRepliedActivities?: number;
    annotations: {
      note: number;
      question: number;
      externalResource: number;
    };
    likes: {
      note: number;
      question: number;
      externalResource: number;
    };
    dislikes: {
      note: number;
      question: number;
      externalResource: number;
    };
  };
  materialDetails?: {
    videos: {
      started: MaterialDetail[];
      completed: MaterialDetail[];
    };
    pdfs: {
      started: MaterialDetail[];
      completed: MaterialDetail[];
    };
  };
}

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
}

