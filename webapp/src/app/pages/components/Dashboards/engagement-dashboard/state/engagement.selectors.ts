import { createFeatureSelector, createSelector } from '@ngrx/store';
import { EngagementState } from './engagement.reducer';

export const selectEngagementState = createFeatureSelector<EngagementState>('engagement');

export const selectEngagementCourseId = createSelector(
  selectEngagementState,
  (state: EngagementState) => state.selectedCourseId
);

export const selectEngagementLevel = createSelector(
  selectEngagementState,
  (state: EngagementState) => state.engagementLevel
);

export const selectEngagementMetrics = createSelector(
  selectEngagementState,
  (state: EngagementState) => state.metrics
);

export const selectEngagementLoading = createSelector(
  selectEngagementState,
  (state: EngagementState) => state.loading
);

export const selectEngagementError = createSelector(
  selectEngagementState,
  (state: EngagementState) => state.error
);

export const selectTabCategoryVisibility = createSelector(
  selectEngagementState,
  (state: EngagementState) => state.tabCategoryVisibility
);

export const selectTabCategoryVisibilityForTab = (tabValue: string) => createSelector(
  selectEngagementState,
  (state: EngagementState) => state.tabCategoryVisibility[tabValue]
);

export const selectCategoryVisibilityForTab = (tabValue: string, category: string) => createSelector(
  selectEngagementState,
  (state: EngagementState) => state.tabCategoryVisibility[tabValue]?.[category] ?? true
);

export const selectCrossCourseFilters = createSelector(
  selectEngagementState,
  (state: EngagementState) => state.crossCourseFilters
);

export const selectHasCrossCourseFilters = createSelector(
  selectEngagementState,
  (state: EngagementState) => state.crossCourseFilters !== null && (state.crossCourseFilters.selectedCourseIds?.length ?? 0) > 0
);
