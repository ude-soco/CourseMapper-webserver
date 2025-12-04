import { createAction, props } from '@ngrx/store';
import { 
  UserPkgGraphData, 
  ConceptRecord, 
  CourseInfo, 
  MaterialInfo,
  ViewMode 
} from '../types/user-pkg.types';

// Load User PKG
export const loadUserPkg = createAction(
  '[User PKG] Load',
  props<{ userId: string; topNConcepts?: number | 'All' }>()
);

export const loadUserPkgSuccess = createAction(
  '[User PKG] Load Success',
  props<{
    graphData: UserPkgGraphData;
    rawConceptRecords: ConceptRecord[];
    courses: CourseInfo[];
    materials: MaterialInfo[];
  }>()
);

export const loadUserPkgFailure = createAction(
  '[User PKG] Load Failure',
  props<{ error: string }>()
);

// View Mode
export const setViewMode = createAction(
  '[User PKG] Set View Mode',
  props<{ viewMode: ViewMode }>()
);

// Search
export const setSearchQuery = createAction(
  '[User PKG] Set Search Query',
  props<{ searchQuery: string }>()
);

// Understanding Status Filter
export const setUnderstandingStatus = createAction(
  '[User PKG] Set Understanding Status',
  props<{ understandingStatus: 'all' | 'u' | 'dnu' }>()
);

// Top N Concepts Filter
export const setTopNConcepts = createAction(
  '[User PKG] Set Top N Concepts',
  props<{ topNConcepts: number | 'All' }>()
);

// Concept Status Update (optimistic update)
export const updateConceptStatus = createAction(
  '[User PKG] Update Concept Status',
  props<{ conceptName: string; status: 'u' | 'dnu' | 'new' }>()
);

// Clear State
export const clearUserPkg = createAction(
  '[User PKG] Clear'
);
