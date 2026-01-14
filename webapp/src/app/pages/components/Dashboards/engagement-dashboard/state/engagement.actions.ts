import { createAction, props } from '@ngrx/store';
import { EngagementMetrics, CategoryVisibility, CrossCourseFilters } from './engagement.models';

// Set selected course ID for engagement dashboard
export const setEngagementCourseId = createAction(
  '[Engagement] Set Course ID',
  props<{ courseId: string }>()
);

// Clear selected course ID
export const clearEngagementCourseId = createAction(
  '[Engagement] Clear Course ID'
);

// Load engagement metrics
export const loadEngagementMetrics = createAction(
  '[Engagement] Load Engagement Metrics',
  props<{ userId: string; courseId: string }>()
);

export const loadEngagementMetricsSuccess = createAction(
  '[Engagement] Load Engagement Metrics Success',
  props<{ metrics: EngagementMetrics }>()
);

export const loadEngagementMetricsFailure = createAction(
  '[Engagement] Load Engagement Metrics Failure',
  props<{ error: any }>()
);

// Set engagement level
export const setEngagementLevel = createAction(
  '[Engagement] Set Engagement Level',
  props<{ level: string }>()
);

// Clear engagement data
export const clearEngagementData = createAction(
  '[Engagement] Clear Engagement Data'
);

// Tab category visibility actions
export const setTabCategoryVisibility = createAction(
  '[Engagement] Set Tab Category Visibility',
  props<{ tabValue: string; category: string; visible: boolean }>()
);

export const setAllTabCategoryVisibility = createAction(
  '[Engagement] Set All Tab Category Visibility',
  props<{ tabValue: string; visibility: CategoryVisibility }>()
);

export const initializeTabCategoryVisibility = createAction(
  '[Engagement] Initialize Tab Category Visibility',
  props<{ tabValue: string }>()
);

// Cross-course filter actions
export const setCrossCourseFilters = createAction(
  '[Engagement] Set Cross-Course Filters',
  props<{ filters: CrossCourseFilters }>()
);

export const clearCrossCourseFilters = createAction(
  '[Engagement] Clear Cross-Course Filters'
);

export const applyCrossCourseFilters = createAction(
  '[Engagement] Apply Cross-Course Filters',
  props<{ filters: CategoryVisibility; selectedCourseIds: string[]; sourceCourseId: string }>()
);
