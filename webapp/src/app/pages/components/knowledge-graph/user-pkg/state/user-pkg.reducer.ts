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
  courseHierarchy: any[] | null;
  courseHierarchyLoading: boolean;
  filterProfiles: any[];
  filterProfilesLoading: boolean;
  interestScores: { [conceptId: string]: { score: number; updatedAt: string } } | null;
  interestScoresLoading: boolean;
  interestScoresError: string | null;
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
    advancedFilters: null,
  },
  courseHierarchy: null,
  courseHierarchyLoading: false,
  filterProfiles: [],
  filterProfilesLoading: false,
  interestScores: null,
  interestScoresLoading: false,
  interestScoresError: null,
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

export const selectAdvancedFilters = createSelector(
  selectFilters,
  (filters) => filters.advancedFilters
);

export const selectCourseHierarchy = createSelector(
  selectUserPkgState,
  (state) => state.courseHierarchy
);

export const selectCourseHierarchyLoading = createSelector(
  selectUserPkgState,
  (state) => state.courseHierarchyLoading
);

export const selectFilterProfiles = createSelector(
  selectUserPkgState,
  (state) => state.filterProfiles
);

export const selectFilterProfilesLoading = createSelector(
  selectUserPkgState,
  (state) => state.filterProfilesLoading
);

export const selectInterestScores = createSelector(
  selectUserPkgState,
  (state) => state.interestScores
);

export const selectInterestScoresLoading = createSelector(
  selectUserPkgState,
  (state) => state.interestScoresLoading
);

export const selectInterestScoresError = createSelector(
  selectUserPkgState,
  (state) => state.interestScoresError
);

// Derived selector: Check if interest scores are loaded
export const selectHasInterestScores = createSelector(
  selectInterestScores,
  (scores) => scores !== null && Object.keys(scores).length > 0
);

// Derived selector: Enrich graph data with interest scores
export const selectGraphDataWithScores = createSelector(
  selectGraphData,
  selectInterestScores,
  selectViewMode,
  (graphData, interestScores, viewMode) => {
    console.log('[Selector] Called - viewMode:', viewMode, 'hasScores:', !!interestScores, 'hasGraph:', !!graphData);
    
    if (!graphData || !interestScores || viewMode !== 'interest') {
      console.log('[Selector] Returning original graph (condition not met)');
      return graphData;
    }

    console.log('[Selector] Enriching graph with scores');
    console.log('[Selector] Available score keys (first 5):', Object.keys(interestScores).slice(0, 5));
    console.log('[Selector] Total scores:', Object.keys(interestScores).length);

    // Clone the graph data to avoid mutations
    const enrichedGraph: UserPkgGraphData = {
      nodes: [...graphData.nodes],
      edges: graphData.edges.map(edge => {
        // Find the concept node this edge points to
        const targetNode = graphData.nodes.find(n => n.data.id === edge.data.target);
        
        if (targetNode && targetNode.data.cid) {
          const scoreInfo = interestScores[targetNode.data.cid];
          
          if (scoreInfo) {
            console.log('[Selector] Found score for', targetNode.data.cid, ':', scoreInfo.score);
            // Add interest score to edge data
            return {
              data: {
                ...edge.data,
                interestScore: scoreInfo.score,
                interestScoreUpdatedAt: scoreInfo.updatedAt
              }
            };
          } else {
            console.log('[Selector] NO score for cid:', targetNode.data.cid);
          }
        } else {
          console.log('[Selector] Target node missing cid:', edge.data.target);
        }
        
        return edge;
      })
    };

    console.log('[Selector] Enrichment complete, enriched edges:', enrichedGraph.edges.filter(e => e.data.interestScore).length);
    return enrichedGraph;
  }
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

  on(UserPkgActions.updateConceptStatus, (state, { conceptIds, status }): UserPkgState => {
    if (!state.graphData || !state.rawConceptRecords.length) return state;

    // Create a Set for O(1) lookup
    const conceptIdSet = new Set(conceptIds);
    
    // Update raw records by concept ID
    const updatedRawRecords = state.rawConceptRecords.map(record => {
      if (conceptIdSet.has(record.cid)) {
        return { ...record, relationshipType: status === 'new' ? 'unknown' : status } as ConceptRecord;
      }
      return record;
    });

    // Update graph edges by concept ID
    const updatedEdges = state.graphData.edges.map(edge => {
      const targetNode = state.graphData!.nodes.find(n => n.data.id === edge.data.target);
      if (targetNode && targetNode.data.cid && conceptIdSet.has(targetNode.data.cid)) {
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

  on(UserPkgActions.setAdvancedFilters, (state, { selectedCourseIds, selectedMaterialIds, selectedSlideIds }): UserPkgState => ({
    ...state,
    filters: {
      ...state.filters,
      advancedFilters: { selectedCourseIds, selectedMaterialIds, selectedSlideIds }
    },
  })),

  on(UserPkgActions.clearAdvancedFilters, (state): UserPkgState => ({
    ...state,
    filters: { ...state.filters, advancedFilters: null },
  })),

  on(UserPkgActions.loadCourseHierarchy, (state): UserPkgState => ({
    ...state,
    courseHierarchyLoading: true,
  })),

  on(UserPkgActions.loadCourseHierarchySuccess, (state, { courses }): UserPkgState => ({
    ...state,
    courseHierarchy: courses,
    courseHierarchyLoading: false,
  })),

  on(UserPkgActions.loadCourseHierarchyFailure, (state): UserPkgState => ({
    ...state,
    courseHierarchyLoading: false,
  })),

  // Filter Profiles
  on(UserPkgActions.loadFilterProfiles, (state): UserPkgState => ({
    ...state,
    filterProfilesLoading: true,
  })),

  on(UserPkgActions.loadFilterProfilesSuccess, (state, { profiles }): UserPkgState => ({
    ...state,
    filterProfiles: profiles,
    filterProfilesLoading: false,
  })),

  on(UserPkgActions.loadFilterProfilesFailure, (state): UserPkgState => ({
    ...state,
    filterProfilesLoading: false,
  })),

  on(UserPkgActions.createFilterProfileSuccess, (state, { profile }): UserPkgState => ({
    ...state,
    filterProfiles: [...state.filterProfiles, profile],
  })),

  on(UserPkgActions.updateFilterProfileSuccess, (state, { profile }): UserPkgState => ({
    ...state,
    filterProfiles: state.filterProfiles.map(p => 
      p._id === profile._id ? profile : p
    ),
  })),

  on(UserPkgActions.deleteFilterProfileSuccess, (state, { profileId }): UserPkgState => ({
    ...state,
    filterProfiles: state.filterProfiles.filter(p => p._id !== profileId),
  })),

  // Interest Scores
  on(UserPkgActions.loadUserInterestScores, (state): UserPkgState => ({
    ...state,
    interestScoresLoading: true,
    interestScoresError: null,
  })),

  on(UserPkgActions.loadUserInterestScoresSuccess, (state, { scores }): UserPkgState => ({
    ...state,
    interestScores: scores,
    interestScoresLoading: false,
    interestScoresError: null,
  })),

  on(UserPkgActions.loadUserInterestScoresFailure, (state, { error }): UserPkgState => ({
    ...state,
    interestScoresLoading: false,
    interestScoresError: error,
  })),

  on(UserPkgActions.clearUserPkg, (): UserPkgState => initialState),
);
