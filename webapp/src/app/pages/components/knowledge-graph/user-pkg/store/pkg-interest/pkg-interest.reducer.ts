import { createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as PkgInterestActions from './pkg-interest.actions';
import { InterestConcept } from '../../types/interest-level.types';

export const pkgInterestFeatureKey = 'pkgInterest';

export interface PkgInterestState {
  concepts: InterestConcept[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  topN: number | 'All';
  searchTerm: string;
}

const initialState: PkgInterestState = {
  concepts: [],
  loading: false,
  loaded: false,
  error: null,
  topN: 25,
  searchTerm: '',
};

export const pkgInterestReducer = createReducer(
  initialState,
  
  // Load Interest Graph
  on(PkgInterestActions.loadInterestGraph, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  
  on(PkgInterestActions.loadInterestGraphSuccess, (state, { concepts }) => ({
    ...state,
    concepts,
    loading: false,
    loaded: true,
    error: null,
  })),
  
  on(PkgInterestActions.loadInterestGraphFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loaded: false,
    error,
  })),
  
  // Filters
  on(PkgInterestActions.setTopN, (state, { topN }) => ({
    ...state,
    topN,
  })),
  
  on(PkgInterestActions.setSearchTerm, (state, { term }) => ({
    ...state,
    searchTerm: term,
  })),
  
  // Clear
  on(PkgInterestActions.clearInterestGraph, () => initialState)
);

// Feature Selector
const selectPkgInterestState = createFeatureSelector<PkgInterestState>(pkgInterestFeatureKey);

// Basic Selectors
export const selectInterestConcepts = createSelector(
  selectPkgInterestState,
  (state) => state.concepts
);

export const selectInterestLoading = createSelector(
  selectPkgInterestState,
  (state) => state.loading
);

export const selectInterestLoaded = createSelector(
  selectPkgInterestState,
  (state) => state.loaded
);

export const selectInterestError = createSelector(
  selectPkgInterestState,
  (state) => state.error
);

export const selectTopN = createSelector(
  selectPkgInterestState,
  (state) => state.topN
);

export const selectSearchTerm = createSelector(
  selectPkgInterestState,
  (state) => state.searchTerm
);

// Computed Selectors
export const selectFilteredInterestConcepts = createSelector(
  selectInterestConcepts,
  selectSearchTerm,
  selectTopN,
  (concepts, searchTerm, topN) => {
    let filtered = [...concepts];
    
    // Apply search filter
    if (searchTerm && searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(concept => 
        concept.conceptName.toLowerCase().includes(query)
      );
    }
    
    // Apply Top N filter
    if (topN !== 'All') {
      filtered = filtered.slice(0, topN);
    }
    
    return filtered;
  }
);
