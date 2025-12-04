import { createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as UserPkgActions from './user-pkg.actions';
import { 
  UserPkgGraphData, 
  ConceptRecord, 
  CourseInfo, 
  MaterialInfo,
  PkgFilters
} from '../types/user-pkg.types';

export const userPkgFeatureKey = 'userPkg';

export interface UserPkgState {
  graphData: UserPkgGraphData | null;
  rawConceptRecords: ConceptRecord[];
  courses: CourseInfo[];
  materials: MaterialInfo[];
  isLoading: boolean;
  error: string | null;
  filters: PkgFilters;
}

const initialState: UserPkgState = {
  graphData: null,
  rawConceptRecords: [],
  courses: [],
  materials: [],
  isLoading: false,
  error: null,
  filters: {
    viewMode: 'knowledge',
    searchQuery: '',
    topNConcepts: 25,
    understandingStatus: 'all',
  },
};

// Feature selector
const selectUserPkgState = createFeatureSelector<UserPkgState>(userPkgFeatureKey);

// Basic selectors
export const selectGraphData = createSelector(
  selectUserPkgState,
  (state) => state.graphData
);

export const selectRawRecords = createSelector(
  selectUserPkgState,
  (state) => state.rawConceptRecords
);

export const selectCourses = createSelector(
  selectUserPkgState,
  (state) => state.courses
);

export const selectMaterials = createSelector(
  selectUserPkgState,
  (state) => state.materials
);

export const selectIsLoading = createSelector(
  selectUserPkgState,
  (state) => state.isLoading
);

export const selectError = createSelector(
  selectUserPkgState,
  (state) => state.error
);

export const selectFilters = createSelector(
  selectUserPkgState,
  (state) => state.filters
);

export const selectViewMode = createSelector(
  selectFilters,
  (filters) => filters.viewMode
);

export const selectSearchQuery = createSelector(
  selectFilters,
  (filters) => filters.searchQuery
);

export const selectTopNConcepts = createSelector(
  selectFilters,
  (filters) => filters.topNConcepts
);

export const selectUnderstandingStatus = createSelector(
  selectFilters,
  (filters) => filters.understandingStatus
);


// Reducer
export const userPkgReducer = createReducer(
  initialState,

  on(UserPkgActions.loadUserPkg, (state, { topNConcepts }): UserPkgState => ({
    ...state,
    isLoading: true,
    error: null,
    filters: { 
      ...state.filters, 
      topNConcepts: topNConcepts ?? state.filters.topNConcepts 
    },
  })),

  on(UserPkgActions.loadUserPkgSuccess, (state, { graphData, rawConceptRecords, courses, materials }): UserPkgState => ({
    ...state,
    graphData,
    rawConceptRecords,
    courses,
    materials,
    isLoading: false,
    error: null,
  })),

  on(UserPkgActions.loadUserPkgFailure, (state, { error }): UserPkgState => ({
    ...state,
    isLoading: false,
    error,
  })),

  on(UserPkgActions.setViewMode, (state, { viewMode }): UserPkgState => ({
    ...state,
    filters: { ...state.filters, viewMode },
  })),

  on(UserPkgActions.setSearchQuery, (state, { searchQuery }): UserPkgState => ({
    ...state,
    filters: { ...state.filters, searchQuery },
  })),

  on(UserPkgActions.setUnderstandingStatus, (state, { understandingStatus }): UserPkgState => ({
    ...state,
    filters: { ...state.filters, understandingStatus },
  })),

  on(UserPkgActions.setTopNConcepts, (state, { topNConcepts }): UserPkgState => ({
    ...state,
    filters: { ...state.filters, topNConcepts },
  })),

  on(UserPkgActions.updateConceptStatus, (state, { conceptName, status }): UserPkgState => {
    if (!state.graphData || !state.rawConceptRecords.length) return state;

    const conceptNameLower = conceptName.toLowerCase().trim();
    
    // Update raw records
    const updatedRawRecords = state.rawConceptRecords.map(record => {
      if (record.name.toLowerCase().trim() === conceptNameLower) {
        return { ...record, relationshipType: status === 'new' ? 'unknown' : status } as ConceptRecord;
      }
      return record;
    });

    // Update graph edges
    const updatedEdges = state.graphData.edges.map(edge => {
      const targetNode = state.graphData!.nodes.find(n => n.data.id === edge.data.target);
      if (targetNode && targetNode.data.name?.toLowerCase().trim() === conceptNameLower) {
        return {
          ...edge,
          data: { ...edge.data, type: status === 'new' ? 'unknown' : status }
        };
      }
      return edge;
    });

    return {
      ...state,
      rawConceptRecords: updatedRawRecords,
      graphData: { ...state.graphData, edges: updatedEdges }
    };
  }),

  on(UserPkgActions.clearUserPkg, (): UserPkgState => initialState),
);
