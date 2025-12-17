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

export interface AnnotationActivityDetail {
  id: string;
  verb: string;
  type: string;
  objectId: string;
  timestamp: string;
  materialId?: string;
  materialName?: string;
  channelId?: string;
  content?: string;
  annotationType?: string;
  interactionType?: 'followed' | 'mentioned' | 'replied';
  action?: 'like' | 'dislike';
  tagAction?: 'added' | 'viewed';
}

export interface AnnotationActivitiesResponse {
  userId: string;
  courseId: string;
  category: string;
  activities: {
    addedAnnotations: AnnotationActivityDetail[];
    annotationInteractions: AnnotationActivityDetail[];
    likesAndDislikes: AnnotationActivityDetail[];
    tagActivities: AnnotationActivityDetail[];
  };
}

export interface KGActivityDetail {
  id: string;
  verb: string;
  type: string;
  objectId: string;
  objectName: string;
  timestamp: string;
  conceptId?: string;
  conceptName?: string;
  conceptType?: string;
  materialId?: string;
  materialName?: string;
  materialPage?: number;
  courseId?: string;
  wikiUrl?: string;
  kgType?: 'Course KG' | 'Material KG' | 'Slide KG' | 'Recommendation KG';
  viewType?: 'Concept' | 'Wiki Article' | 'Visual Explanation' | 'Textual Explanation';
  markType?: 'Understood' | 'Did Not Understand' | 'New';
}

export interface KGActivitiesResponse {
  userId: string;
  courseId: string;
  category: string;
  activities: {
    kgAccesses: KGActivityDetail[];
    conceptsViewed: KGActivityDetail[];
    markedConcepts: KGActivityDetail[];
  };
}

export interface RecommendationActivityDetail {
  id: string;
  verb: string;
  type: string;
  objectId: string;
  objectName: string;
  timestamp: string;
  materialId?: string;
  materialName?: string;
  materialPage?: number;
  courseId?: string;
  markType?: 'Helpful' | 'Not Helpful' | 'Understood' | 'Did Not Understand' | 'New';
  resourceType?: 'Article' | 'Video';
  resourceName?: string;
  conceptName?: string;
  conceptId?: string;
}

export interface RecommendationActivitiesResponse {
  userId: string;
  courseId: string;
  category: string;
  activities: {
    materialActivities: RecommendationActivityDetail[];
    conceptActivities: RecommendationActivityDetail[];
  };
}

export interface AccessActivityDetail {
  id: string;
  verb: string;
  type: string;
  objectId: string;
  objectName: string;
  timestamp: string;
  // Course-specific
  accessedCourseId?: string;
  courseName?: string;
  // Topic-specific
  topicId?: string;
  topicName?: string;
  // Channel-specific
  channelId?: string;
  channelName?: string;
  // Material-specific
  materialId?: string;
  materialName?: string;
  materialType?: 'PDF' | 'Video' | 'Unknown';
}

export interface AccessActivityFrequency {
  name: string;
  count: number;
}

export interface AccessActivitiesResponse {
  userId: string;
  courseId: string;
  category: string;
  activities: {
    courseAccesses: AccessActivityDetail[];
    topicAccesses: AccessActivityDetail[];
    channelAccesses: AccessActivityDetail[];
    materialAccesses: AccessActivityDetail[];
  };
  summary: {
    courseFrequency: AccessActivityFrequency[];
    topicFrequency: AccessActivityFrequency[];
    channelFrequency: AccessActivityFrequency[];
    materialFrequency: AccessActivityFrequency[];
    totals: {
      course: number;
      topic: number;
      channel: number;
      material: number;
    };
  };
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
  slideAndVideoDetails?: {
    pdfSlides: {
      id: string;
      name: string;
      uniqueSlidesViewed: number;
      totalSlidesViewed: number;
      maxSlideViewed: number;
      totalSlides: number;
      lastAccessedSlide: number;
    }[];
    videoTime: {
      id: string;
      name: string;
      timeInSeconds: number;
      timeInMinutes: number;
      lastAccessedTimestamp: number;
    }[];
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

  /**
   * Get peer activities data for a specific course
   * Returns activity metrics for all users enrolled in the specified course
   * @param courseId - The course ID to get peer activities for
   */
  getPeerActivities(courseId: string): Observable<any> {
    return this.http.get<any>(
      `${this.API_URL}/engagement/peer-activities`,
      { params: { courseId } }
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
   * Get annotation activity details for a specific user and course
   * @param userId - The user ID
   * @param courseId - The course ID
   * @param category - Filter by category: 'added', 'interactions', 'likesdislikes', 'tags', or 'all'
   */
  getAnnotationActivityDetails(userId: string, courseId: string, category: string = 'all'): Observable<AnnotationActivitiesResponse> {
    return this.http.get<AnnotationActivitiesResponse>(
      `${this.API_URL}/engagement/user/${userId}/course/${courseId}/annotation-activities`,
      { params: { category } }
    );
  }

  /**
   * Get knowledge graph activity details for a specific user and course
   * @param userId - The user ID
   * @param courseId - The course ID
   * @param category - Filter by category: 'summary' (accesses & views), 'marked' (U/DNU/new), or 'all'
   */
  getKGActivityDetails(userId: string, courseId: string, category: string = 'all'): Observable<KGActivitiesResponse> {
    return this.http.get<KGActivitiesResponse>(
      `${this.API_URL}/engagement/user/${userId}/course/${courseId}/kg-activities`,
      { params: { category } }
    );
  }

  /**
   * Get detailed recommendation activity information
   * @param userId - The user ID
   * @param courseId - The course ID
   * @param category - Filter by category: 'materials' (helpful/not helpful), 'concepts' (U/DNU/new), or 'all'
   */
  getRecommendationActivityDetails(userId: string, courseId: string, category: string = 'all'): Observable<RecommendationActivitiesResponse> {
    return this.http.get<RecommendationActivitiesResponse>(
      `${this.API_URL}/engagement/user/${userId}/course/${courseId}/recommendation-activities`,
      { params: { category } }
    );
  }

  /**
   * Get access activity details for a specific user and course
   * @param userId - The user ID
   * @param courseId - The course ID
   * @param category - Filter by category: 'course', 'topic', 'channel', 'material', or 'all'
   */
  getAccessActivityDetails(userId: string, courseId: string, category: string = 'all'): Observable<AccessActivitiesResponse> {
    return this.http.get<AccessActivitiesResponse>(
      `${this.API_URL}/engagement/user/${userId}/course/${courseId}/access-activities`,
      { params: { category } }
    );
  }

  /**
   * Get higher engagement level boundaries
   * Returns minimum values from users in the next higher engagement level
   * Used for "My Activities vs. Higher Engagement Level Boundaries" tab
   * @param userId - The user ID
   * @param courseId - The course ID
   */
  getHigherEngagementLevelBoundaries(userId: string, courseId: string): Observable<HigherLevelBoundariesResponse> {
    return this.http.get<HigherLevelBoundariesResponse>(
      `${this.API_URL}/engagement/user/${userId}/course/${courseId}/higher-level-boundaries`
    );
  }
}

/**
 * Response interface for higher engagement level boundaries
 */
export interface HigherLevelBoundariesResponse {
  userId: string;
  courseId: string;
  currentUserEngagementLevel: string;
  higherLevel?: string;
  isHighestLevel: boolean;
  message?: string;
  higherLevelStats: {
    usersInHigherLevel: number;
  } | null;
  boundaries: {
    [key: string]: {
      minimum: number;
      usersCount: number;
    };
  } | null;
}

