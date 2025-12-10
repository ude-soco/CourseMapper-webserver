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
  props<{ userId: string; topNConcepts?: number | 'All'; slideIds?: string[] }>()
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

// Advanced Filters
export const setAdvancedFilters = createAction(
  '[User PKG] Set Advanced Filters',
  props<{ 
    selectedCourseIds: string[];
    selectedMaterialIds: string[];
    selectedSlideIds: string[];
  }>()
);

export const clearAdvancedFilters = createAction(
  '[User PKG] Clear Advanced Filters'
);

// Course Hierarchy (for advanced filters dialog)
export const loadCourseHierarchy = createAction(
  '[User PKG] Load Course Hierarchy'
);

export const loadCourseHierarchySuccess = createAction(
  '[User PKG] Load Course Hierarchy Success',
  props<{ courses: any[] }>()
);

export const loadCourseHierarchyFailure = createAction(
  '[User PKG] Load Course Hierarchy Failure',
  props<{ error: string }>()
);

// Filter Profiles
export const loadFilterProfiles = createAction(
  '[User PKG] Load Filter Profiles'
);

export const loadFilterProfilesSuccess = createAction(
  '[User PKG] Load Filter Profiles Success',
  props<{ profiles: any[] }>()
);

export const loadFilterProfilesFailure = createAction(
  '[User PKG] Load Filter Profiles Failure',
  props<{ error: string }>()
);

export const createFilterProfile = createAction(
  '[User PKG] Create Filter Profile',
  props<{ name: string; slideIds: string[] }>()
);

export const createFilterProfileSuccess = createAction(
  '[User PKG] Create Filter Profile Success',
  props<{ profile: any }>()
);

export const createFilterProfileFailure = createAction(
  '[User PKG] Create Filter Profile Failure',
  props<{ error: string }>()
);

export const updateFilterProfile = createAction(
  '[User PKG] Update Filter Profile',
  props<{ profileId: string; name: string; slideIds: string[] }>()
);

export const updateFilterProfileSuccess = createAction(
  '[User PKG] Update Filter Profile Success',
  props<{ profile: any }>()
);

export const updateFilterProfileFailure = createAction(
  '[User PKG] Update Filter Profile Failure',
  props<{ error: string }>()
);

export const deleteFilterProfile = createAction(
  '[User PKG] Delete Filter Profile',
  props<{ profileId: string }>()
);

export const deleteFilterProfileSuccess = createAction(
  '[User PKG] Delete Filter Profile Success',
  props<{ profileId: string }>()
);

export const deleteFilterProfileFailure = createAction(
  '[User PKG] Delete Filter Profile Failure',
  props<{ error: string }>()
);

// Clear State
export const clearUserPkg = createAction(
  '[User PKG] Clear'
);
