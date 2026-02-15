import { createReducer, on } from '@ngrx/store';
import * as EngagementActions from './engagement.actions';
import { EngagementMetrics, TabCategoryVisibility, CrossCourseFilters, CategoryVisibility } from './engagement.models';

export interface EngagementState {
  selectedCourseId: string | null;
  engagementLevel: string;
  metrics: EngagementMetrics | null;
  loading: boolean;
  error: any;
  tabCategoryVisibility: TabCategoryVisibility;
  crossCourseFilters: CrossCourseFilters | null;
}

export const initialState: EngagementState = {
  selectedCourseId: null,
  engagementLevel: 'Low',
  metrics: null,
  loading: false,
  error: null,
  tabCategoryVisibility: {},
  crossCourseFilters: null
};

export const engagementReducer = createReducer(
  initialState,
  on(EngagementActions.setEngagementCourseId, (state, { courseId }) => ({
    ...state,
    selectedCourseId: courseId
  })),
  on(EngagementActions.clearEngagementCourseId, (state) => ({
    ...state,
    selectedCourseId: null
  })),
  on(EngagementActions.loadEngagementMetrics, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  on(EngagementActions.loadEngagementMetricsSuccess, (state, { metrics }) => ({
    ...state,
    metrics,
    loading: false,
    error: null,
    engagementLevel: metrics.engagementLevel 
      ? metrics.engagementLevel.charAt(0).toUpperCase() + metrics.engagementLevel.slice(1).toLowerCase()
      : state.engagementLevel
  })),
  on(EngagementActions.loadEngagementMetricsFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  on(EngagementActions.setEngagementLevel, (state, { level }) => ({
    ...state,
    engagementLevel: level
  })),
  on(EngagementActions.clearEngagementData, () => initialState),
  on(EngagementActions.initializeTabCategoryVisibility, (state, { tabValue }) => ({
    ...state,
    tabCategoryVisibility: {
      ...state.tabCategoryVisibility,
      [tabValue]: state.tabCategoryVisibility[tabValue] || {
        material: true,
        annotation: true,
        access: true,
        kg: true,
        recommendation: true
      }
    }
  })),
  on(EngagementActions.setTabCategoryVisibility, (state, { tabValue, category, visible }) => {
    const currentTabVisibility = state.tabCategoryVisibility[tabValue] || {
      material: true,
      annotation: true,
      access: true,
      kg: true,
      recommendation: true
    };
    return {
      ...state,
      tabCategoryVisibility: {
        ...state.tabCategoryVisibility,
        [tabValue]: {
          ...currentTabVisibility,
          [category]: visible
        }
      }
    };
  }),
  on(EngagementActions.setAllTabCategoryVisibility, (state, { tabValue, visibility }) => ({
    ...state,
    tabCategoryVisibility: {
      ...state.tabCategoryVisibility,
      [tabValue]: visibility
    }
  })),
  on(EngagementActions.setCrossCourseFilters, (state, { filters }) => ({
    ...state,
    crossCourseFilters: filters
  })),
  on(EngagementActions.clearCrossCourseFilters, (state) => ({
    ...state,
    crossCourseFilters: null
  })),
  on(EngagementActions.applyCrossCourseFilters, (state, { filters, selectedCourseIds, sourceCourseId }) => ({
    ...state,
    crossCourseFilters: {
      filters,
      selectedCourseIds,
      appliedAt: new Date().toISOString(),
      sourceCourseId
    }
  }))
);

