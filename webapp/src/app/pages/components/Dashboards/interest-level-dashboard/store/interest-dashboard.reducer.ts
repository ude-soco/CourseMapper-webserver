import { createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as InterestDashboardActions from './interest-dashboard.actions';
import {
  InterestDashboardState,
  initialInterestDashboardState,
  ActivityCategoryGroup
} from './interest-dashboard.state';

export const interestDashboardFeatureKey = 'interestDashboard';

export const interestDashboardReducer = createReducer(
  initialInterestDashboardState,
  
  // ===========================
  // Route & Initialization
  // ===========================
  
  on(InterestDashboardActions.setConceptParams, (state, { conceptName, conceptId }) => ({
    ...state,
    conceptName,
    conceptId
  })),
  
  // ===========================
  // Load Concept Data
  // ===========================
  
  on(InterestDashboardActions.loadConceptData, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  on(InterestDashboardActions.loadConceptDataSuccess, (state, { data }) => ({
    ...state,
    conceptData: data,
    loading: false,
    error: null
  })),
  
  on(InterestDashboardActions.loadConceptDataFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // ===========================
  // Load Top Concepts
  // ===========================
  
  on(InterestDashboardActions.loadTopConcepts, (state) => ({
    ...state,
    loadingTopConcepts: true
  })),
  
  on(InterestDashboardActions.loadTopConceptsSuccess, (state, { concepts }) => ({
    ...state,
    topConcepts: concepts,
    loadingTopConcepts: false
  })),
  
  on(InterestDashboardActions.loadTopConceptsFailure, (state, { error }) => ({
    ...state,
    loadingTopConcepts: false,
    error
  })),
  
  // ===========================
  // Activity Categories
  // ===========================
  
  on(InterestDashboardActions.setActivityCategories, (state, { categories }) => ({
    ...state,
    activityCategories: categories
  })),
  
  on(InterestDashboardActions.toggleCategoryExpand, (state, { categoryKey }) => ({
    ...state,
    activityCategories: state.activityCategories.map(cat =>
      cat.categoryKey === categoryKey
        ? { ...cat, expanded: !cat.expanded }
        : cat
    )
  })),
  
  on(InterestDashboardActions.toggleCategoryView, (state, { categoryKey }) => ({
    ...state,
    activityCategories: state.activityCategories.map(cat =>
      cat.categoryKey === categoryKey
        ? { ...cat, showTextView: !cat.showTextView }
        : cat
    )
  })),
  
  on(InterestDashboardActions.toggleCategoryVisibility, (state, { categoryKey }) => ({
    ...state,
    activityCategories: state.activityCategories.map(cat =>
      cat.categoryKey === categoryKey
        ? { ...cat, visible: !cat.visible }
        : cat
    )
  })),
  
  // ===========================
  // Charts
  // ===========================
  
  on(InterestDashboardActions.setGaugeChart, (state, { data, options }) => ({
    ...state,
    charts: {
      ...state.charts,
      gauge: { data, options }
    }
  })),
  
  on(InterestDashboardActions.setTotalActivitiesChart, (state, { data, options }) => ({
    ...state,
    charts: {
      ...state.charts,
      totalActivities: { data, options }
    }
  })),
  
  on(InterestDashboardActions.setTopConceptsChart, (state, { data, options }) => ({
    ...state,
    charts: {
      ...state.charts,
      topConcepts: { data, options }
    }
  })),
  
  on(InterestDashboardActions.setCategoryChart, (state, { categoryKey, data, options }) => ({
    ...state,
    charts: {
      ...state.charts,
      categories: {
        ...state.charts.categories,
        [categoryKey]: { data, options }
      }
    }
  })),
  
  // ===========================
  // UI State
  // ===========================
  
  on(InterestDashboardActions.setActiveTab, (state, { tabIndex }) => ({
    ...state,
    activeTabIndex: tabIndex
  })),
  
  on(InterestDashboardActions.setTopConceptsLimit, (state, { limit }) => ({
    ...state,
    topConceptsLimit: limit
  })),
  
  on(InterestDashboardActions.setReturnViewMode, (state, { viewMode }) => ({
    ...state,
    returnViewMode: viewMode
  })),
  
  on(InterestDashboardActions.clearReturnViewMode, (state) => ({
    ...state,
    returnViewMode: null
  })),
  
  // ===========================
  // Clear State
  // ===========================
  
  on(InterestDashboardActions.clearDashboard, () => initialInterestDashboardState)
);

// ===========================
// Feature Selector
// ===========================

const selectInterestDashboardState = createFeatureSelector<InterestDashboardState>(
  interestDashboardFeatureKey
);

// ===========================
// Basic Selectors
// ===========================

export const selectConceptName = createSelector(
  selectInterestDashboardState,
  (state) => state.conceptName
);

export const selectConceptId = createSelector(
  selectInterestDashboardState,
  (state) => state.conceptId
);

export const selectConceptData = createSelector(
  selectInterestDashboardState,
  (state) => state.conceptData
);

export const selectActivityCategories = createSelector(
  selectInterestDashboardState,
  (state) => state.activityCategories
);

export const selectTopConcepts = createSelector(
  selectInterestDashboardState,
  (state) => state.topConcepts
);

export const selectLoading = createSelector(
  selectInterestDashboardState,
  (state) => state.loading
);

export const selectLoadingTopConcepts = createSelector(
  selectInterestDashboardState,
  (state) => state.loadingTopConcepts
);

export const selectError = createSelector(
  selectInterestDashboardState,
  (state) => state.error
);

export const selectCharts = createSelector(
  selectInterestDashboardState,
  (state) => state.charts
);

export const selectGaugeChart = createSelector(
  selectCharts,
  (charts) => charts.gauge
);

export const selectTotalActivitiesChart = createSelector(
  selectCharts,
  (charts) => charts.totalActivities
);

export const selectTopConceptsChart = createSelector(
  selectCharts,
  (charts) => charts.topConcepts
);

export const selectCategoryCharts = createSelector(
  selectCharts,
  (charts) => charts.categories
);

export const selectActiveTabIndex = createSelector(
  selectInterestDashboardState,
  (state) => state.activeTabIndex
);

export const selectTopConceptsLimit = createSelector(
  selectInterestDashboardState,
  (state) => state.topConceptsLimit
);

export const selectReturnViewMode = createSelector(
  selectInterestDashboardState,
  (state) => state.returnViewMode
);

// ===========================
// Computed Selectors
// ===========================

export const selectInterestScore = createSelector(
  selectConceptData,
  (conceptData) => conceptData?.normalized_scores?.min_max_interpolation ?? 0
);

export const selectVisibleCategories = createSelector(
  selectActivityCategories,
  (categories) => categories.filter(cat => cat.visible)
);

export const selectCategoryByKey = (categoryKey: string) =>
  createSelector(selectActivityCategories, (categories) =>
    categories.find(cat => cat.categoryKey === categoryKey)
  );

export const selectCategoryChartByKey = (categoryKey: string) =>
  createSelector(selectCategoryCharts, (charts) => charts[categoryKey] || null);

export const selectHasData = createSelector(
  selectConceptData,
  (conceptData) => conceptData !== null
);

export const selectTotalActivityCount = createSelector(
  selectConceptData,
  (conceptData) => conceptData?.total_activity_count ?? 0
);

export const selectRawScore = createSelector(
  selectConceptData,
  (conceptData) => conceptData?.raw_score ?? 0
);
