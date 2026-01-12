import { createAction, props } from '@ngrx/store';
import {
  ConceptInterestData,
  ActivityCategoryGroup,
  TopConcept,
  ChartData,
  ChartOptions
} from './interest-dashboard.state';

// ===========================
// Route & Initialization Actions
// ===========================

export const setConceptParams = createAction(
  '[Interest Dashboard] Set Concept Params',
  props<{ conceptName: string; conceptId: string }>()
);

export const initializeDashboard = createAction(
  '[Interest Dashboard] Initialize Dashboard',
  props<{ userId: string; conceptName: string }>()
);

// ===========================
// Load Concept Data Actions
// ===========================

export const loadConceptData = createAction(
  '[Interest Dashboard] Load Concept Data',
  props<{ userId: string; conceptName: string }>()
);

export const loadConceptDataSuccess = createAction(
  '[Interest Dashboard] Load Concept Data Success',
  props<{ data: ConceptInterestData }>()
);

export const loadConceptDataFailure = createAction(
  '[Interest Dashboard] Load Concept Data Failure',
  props<{ error: string }>()
);

// ===========================
// Load Top Concepts Actions
// ===========================

export const loadTopConcepts = createAction(
  '[Interest Dashboard] Load Top Concepts',
  props<{ userId: string; limit: number }>()
);

export const loadTopConceptsSuccess = createAction(
  '[Interest Dashboard] Load Top Concepts Success',
  props<{ concepts: TopConcept[] }>()
);

export const loadTopConceptsFailure = createAction(
  '[Interest Dashboard] Load Top Concepts Failure',
  props<{ error: string }>()
);

// ===========================
// Activity Categories Actions
// ===========================

export const setActivityCategories = createAction(
  '[Interest Dashboard] Set Activity Categories',
  props<{ categories: ActivityCategoryGroup[] }>()
);

export const toggleCategoryExpand = createAction(
  '[Interest Dashboard] Toggle Category Expand',
  props<{ categoryKey: string }>()
);

export const toggleCategoryView = createAction(
  '[Interest Dashboard] Toggle Category View',
  props<{ categoryKey: string }>()
);

export const toggleCategoryVisibility = createAction(
  '[Interest Dashboard] Toggle Category Visibility',
  props<{ categoryKey: string }>()
);

// ===========================
// Chart Actions
// ===========================

export const setGaugeChart = createAction(
  '[Interest Dashboard] Set Gauge Chart',
  props<{ data: ChartData; options: ChartOptions }>()
);

export const setTotalActivitiesChart = createAction(
  '[Interest Dashboard] Set Total Activities Chart',
  props<{ data: ChartData; options: ChartOptions }>()
);

export const setTopConceptsChart = createAction(
  '[Interest Dashboard] Set Top Concepts Chart',
  props<{ data: ChartData; options: ChartOptions }>()
);

export const setCategoryChart = createAction(
  '[Interest Dashboard] Set Category Chart',
  props<{ categoryKey: string; data: ChartData; options: ChartOptions }>()
);

// ===========================
// UI State Actions
// ===========================

export const setActiveTab = createAction(
  '[Interest Dashboard] Set Active Tab',
  props<{ tabIndex: number }>()
);

export const setTopConceptsLimit = createAction(
  '[Interest Dashboard] Set Top Concepts Limit',
  props<{ limit: number | 'All' }>()
);

export const setReturnViewMode = createAction(
  '[Interest Dashboard] Set Return View Mode',
  props<{ viewMode: 'interest' | 'engagement' | 'knowledge' | null }>()
);

export const clearReturnViewMode = createAction(
  '[Interest Dashboard] Clear Return View Mode'
);

// ===========================
// Clear State
// ===========================

export const clearDashboard = createAction(
  '[Interest Dashboard] Clear Dashboard'
);
