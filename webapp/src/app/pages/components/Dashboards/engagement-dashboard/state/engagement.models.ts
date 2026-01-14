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
    totalAnnotationsMentioned: number;
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
    totalActivities?: number;
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
      lastAccessedSlide: number;
      totalSlides: number;
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
  kgType?: string;
  viewType?: string;
  markType?: string;
}

export interface HigherLevelBoundariesResponse {
  userId: string;
  courseId: string;
  currentUserEngagementLevel: string;
  isHighestLevel: boolean;
  message?: string;
  higherLevel?: string;
  higherLevelStats?: {
    usersInHigherLevel: number;
  };
  boundaries: any;
}

export interface AccessActivityDetail {
  id: string;
  verb: string;
  type: string;
  objectId: string;
  objectName: string;
  timestamp: string;
  materialId?: string;
  materialName?: string;
  materialType?: string;
  channelId?: string;
  topicId?: string;
  accessedCourseId?: string;
  courseName?: string;
  channelName?: string;
  topicName?: string;
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

export interface CategoryVisibility {
  material: boolean;
  annotation: boolean;
  access: boolean;
  kg: boolean;
  recommendation: boolean;
}

export interface TabCategoryVisibility {
  [tabValue: string]: CategoryVisibility;
}

export interface CrossCourseFilters {
  filters: CategoryVisibility;
  selectedCourseIds: string[];
  appliedAt: string;
  sourceCourseId: string;
}
