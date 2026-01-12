import { createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as PkgInterestActions from './pkg-interest.actions';
import { 
  PkgInterestState,
  initialTooltipState,
  initialScoreEditState,
  initialGraphState,
  initialPanelVisibility,
  initialLegendVisibility
} from './pkg-interest.state';

export const pkgInterestFeatureKey = 'pkgInterest';

const initialState: PkgInterestState = {
  // Data state
  concepts: [],
  loading: false,
  loaded: false,
  error: null,
  
  // Filter state
  topN: 25,
  searchTerm: '',
  
  // UI state
  tooltip: initialTooltipState,
  scoreEdit: initialScoreEditState,
  graph: initialGraphState,
  selectedConcept: null,
  panels: initialPanelVisibility,
  legends: initialLegendVisibility,
  returnViewMode: null,
};

export const pkgInterestReducer = createReducer(
  initialState,
  
  // ===========================
  // Data Loading Reducers
  // ===========================
  
  on(PkgInterestActions.loadInterestGraph, (state) => ({
    ...state,
    loading: true,
    error: null,
  })),
  
  on(PkgInterestActions.loadInterestGraphSuccess, (state, { concepts }) => {
    // Deduplicate concepts by conceptId as a safety measure
    const uniqueConcepts = Array.from(
      new Map(concepts.map(c => [c.conceptId, c])).values()
    );
    
    return {
      ...state,
      concepts: uniqueConcepts,
      loading: false,
      loaded: true,
      error: null,
    };
  }),
  
  on(PkgInterestActions.loadInterestGraphFailure, (state, { error }) => ({
    ...state,
    loading: false,
    loaded: false,
    error,
  })),
  
  // ===========================
  // Filter Reducers
  // ===========================
  
  on(PkgInterestActions.setTopN, (state, { topN }) => ({
    ...state,
    topN,
  })),
  
  on(PkgInterestActions.setSearchTerm, (state, { term }) => ({
    ...state,
    searchTerm: term,
  })),
  
  // ===========================
  // Tooltip Reducers
  // ===========================
  
  on(PkgInterestActions.showTooltip, (state, { x, y, text, conceptId, conceptName, conceptIds, originalScore }) => ({
    ...state,
    tooltip: {
      visible: true,
      x,
      y,
      text,
      conceptId,
      conceptName,
      conceptIds,
      originalScore,
      isHovered: false,
    },
  })),
  
  on(PkgInterestActions.hideTooltip, (state) => ({
    ...state,
    tooltip: initialTooltipState,
  })),
  
  on(PkgInterestActions.setTooltipHovered, (state, { isHovered }) => ({
    ...state,
    tooltip: {
      ...state.tooltip,
      isHovered,
    },
  })),
  
  // ===========================
  // Score Edit Reducers
  // ===========================
  
  on(PkgInterestActions.startScoreEdit, (state, { conceptId, conceptName, conceptIds, originalScore }) => ({
    ...state,
    scoreEdit: {
      conceptId,
      conceptName,
      conceptIds,
      originalScore,
      adjustedScore: originalScore,
      hasChanged: false,
      canEdit: true,
      isUpdating: false,
    },
  })),
  
  on(PkgInterestActions.updateAdjustedScore, (state, { score }) => ({
    ...state,
    scoreEdit: {
      ...state.scoreEdit,
      adjustedScore: score,
      hasChanged: score !== state.scoreEdit.originalScore,
    },
  })),
  
  on(PkgInterestActions.cancelScoreEdit, (state) => ({
    ...state,
    scoreEdit: initialScoreEditState,
  })),
  
  on(PkgInterestActions.saveScoreEdit, (state) => ({
    ...state,
    scoreEdit: {
      ...state.scoreEdit,
      isUpdating: true,
    },
  })),
  
  on(PkgInterestActions.saveScoreEditSuccess, (state, { conceptId, conceptIds, score }) => {
    // Optimistically update concept scores in the store
    const updatedConcepts = state.concepts.map(concept => {
      if (conceptIds.includes(concept.conceptId)) {
        return { ...concept, interestScore: score };
      }
      return concept;
    });
    
    return {
      ...state,
      concepts: updatedConcepts,
      scoreEdit: initialScoreEditState,
      graph: {
        ...state.graph,
        lastEditedConceptId: conceptId,
      },
    };
  }),
  
  on(PkgInterestActions.saveScoreEditFailure, (state, { error }) => ({
    ...state,
    scoreEdit: {
      ...state.scoreEdit,
      isUpdating: false,
    },
    error,
  })),
  
  // ===========================
  // Graph State Reducers
  // ===========================
  
  on(PkgInterestActions.saveGraphPositions, (state, { positions }) => ({
    ...state,
    graph: {
      ...state.graph,
      nodePositions: positions,
    },
  })),
  
  on(PkgInterestActions.clearGraphPositions, (state) => ({
    ...state,
    graph: {
      ...state.graph,
      nodePositions: null,
    },
  })),
  
  on(PkgInterestActions.setGraphLayout, (state, { layout }) => ({
    ...state,
    graph: {
      ...state.graph,
      lastLayout: layout,
    },
  })),
  
  on(PkgInterestActions.setGraphZoomPan, (state, { zoom, pan }) => ({
    ...state,
    graph: {
      ...state.graph,
      zoom,
      pan,
    },
  })),
  
  on(PkgInterestActions.setLastEditedConcept, (state, { conceptId }) => ({
    ...state,
    graph: {
      ...state.graph,
      lastEditedConceptId: conceptId,
    },
  })),
  
  // ===========================
  // Concept Selection Reducers
  // ===========================
  
  on(PkgInterestActions.selectConcept, (state, { concept }) => ({
    ...state,
    selectedConcept: concept,
    panels: {
      ...state.panels,
      conceptDetailsVisible: true,
    },
  })),
  
  on(PkgInterestActions.deselectConcept, (state) => ({
    ...state,
    selectedConcept: null,
    panels: {
      ...state.panels,
      conceptDetailsVisible: false,
    },
  })),
  
  // ===========================
  // Panel Visibility Reducers
  // ===========================
  
  on(PkgInterestActions.setConceptDetailsPanelVisibility, (state, { visible }) => ({
    ...state,
    panels: {
      ...state.panels,
      conceptDetailsVisible: visible,
    },
    selectedConcept: visible ? state.selectedConcept : null,
  })),
  
  on(PkgInterestActions.setCourseDetailsPanelVisibility, (state, { visible }) => ({
    ...state,
    panels: {
      ...state.panels,
      courseDetailsVisible: visible,
    },
  })),
  
  on(PkgInterestActions.setHelpDialogVisibility, (state, { visible }) => ({
    ...state,
    panels: {
      ...state.panels,
      helpDialogVisible: visible,
    },
  })),
  
  // ===========================
  // Legend Visibility Reducers
  // ===========================
  
  on(PkgInterestActions.setLegendVisibility, (state, { legends }) => ({
    ...state,
    legends: {
      ...state.legends,
      ...legends,
    },
  })),
  
  on(PkgInterestActions.resetLegendVisibility, (state) => ({
    ...state,
    legends: initialLegendVisibility,
  })),
  
  // ===========================
  // Return View Mode Reducers
  // ===========================
  
  on(PkgInterestActions.setReturnViewMode, (state, { viewMode }) => ({
    ...state,
    returnViewMode: viewMode,
  })),
  
  on(PkgInterestActions.clearReturnViewMode, (state) => ({
    ...state,
    returnViewMode: null,
  })),
  
  // ===========================
  // Clear State
  // ===========================
  
  on(PkgInterestActions.clearInterestGraph, () => initialState)
);

// ===========================
// Feature Selector
// ===========================

const selectPkgInterestState = createFeatureSelector<PkgInterestState>(pkgInterestFeatureKey);

// ===========================
// Basic Selectors
// ===========================

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

// ===========================
// UI State Selectors
// ===========================

export const selectTooltipState = createSelector(
  selectPkgInterestState,
  (state) => state.tooltip
);

export const selectScoreEditState = createSelector(
  selectPkgInterestState,
  (state) => state.scoreEdit
);

export const selectGraphState = createSelector(
  selectPkgInterestState,
  (state) => state.graph
);

export const selectGraphPositions = createSelector(
  selectGraphState,
  (graphState) => graphState.nodePositions
);

export const selectLastEditedConceptId = createSelector(
  selectGraphState,
  (graphState) => graphState.lastEditedConceptId
);

export const selectSelectedConcept = createSelector(
  selectPkgInterestState,
  (state) => state.selectedConcept
);

export const selectPanelVisibility = createSelector(
  selectPkgInterestState,
  (state) => state.panels
);

export const selectLegendVisibility = createSelector(
  selectPkgInterestState,
  (state) => state.legends
);

export const selectReturnViewMode = createSelector(
  selectPkgInterestState,
  (state) => state.returnViewMode
);

// ===========================
// Computed Selectors
// ===========================

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

export const selectIsScoreEditing = createSelector(
  selectScoreEditState,
  (scoreEdit) => scoreEdit.conceptId !== null
);

export const selectHasScoreChanged = createSelector(
  selectScoreEditState,
  (scoreEdit) => scoreEdit.hasChanged
);

