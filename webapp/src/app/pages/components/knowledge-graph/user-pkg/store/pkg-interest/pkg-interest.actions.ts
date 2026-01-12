import { createAction, props } from '@ngrx/store';
import { InterestConcept } from '../../types/interest-level.types';
import { 
  TooltipState, 
  ScoreEditState, 
  SelectedConcept, 
  PanelVisibility, 
  LegendVisibility 
} from './pkg-interest.state';

// ===========================
// Data Loading Actions
// ===========================

export const loadInterestGraph = createAction(
  '[PKG Interest] Load Interest Graph',
  props<{ userId: string; topN: number | 'All' }>()
);

export const loadInterestGraphSuccess = createAction(
  '[PKG Interest] Load Interest Graph Success',
  props<{ concepts: InterestConcept[] }>()
);

export const loadInterestGraphFailure = createAction(
  '[PKG Interest] Load Interest Graph Failure',
  props<{ error: string }>()
);

// ===========================
// Filter Actions
// ===========================

export const setTopN = createAction(
  '[PKG Interest] Set Top N',
  props<{ topN: number | 'All' }>()
);

export const setSearchTerm = createAction(
  '[PKG Interest] Set Search Term',
  props<{ term: string }>()
);

// ===========================
// Tooltip Actions
// ===========================

export const showTooltip = createAction(
  '[PKG Interest] Show Tooltip',
  props<{ 
    x: number; 
    y: number; 
    text: string; 
    conceptId: string; 
    conceptName: string;
    conceptIds: string[];
    originalScore: number;
  }>()
);

export const hideTooltip = createAction(
  '[PKG Interest] Hide Tooltip'
);

export const setTooltipHovered = createAction(
  '[PKG Interest] Set Tooltip Hovered',
  props<{ isHovered: boolean }>()
);

// ===========================
// Score Edit Actions
// ===========================

export const startScoreEdit = createAction(
  '[PKG Interest] Start Score Edit',
  props<{ 
    conceptId: string; 
    conceptName: string;
    conceptIds: string[];
    originalScore: number; 
  }>()
);

export const updateAdjustedScore = createAction(
  '[PKG Interest] Update Adjusted Score',
  props<{ score: number }>()
);

export const cancelScoreEdit = createAction(
  '[PKG Interest] Cancel Score Edit'
);

export const saveScoreEdit = createAction(
  '[PKG Interest] Save Score Edit',
  props<{ 
    userId: string;
    conceptId: string; 
    conceptIds: string[];
    conceptName: string;
    score: number; 
  }>()
);

export const saveScoreEditSuccess = createAction(
  '[PKG Interest] Save Score Edit Success',
  props<{ 
    conceptId: string; 
    conceptIds: string[];
    score: number; 
  }>()
);

export const saveScoreEditFailure = createAction(
  '[PKG Interest] Save Score Edit Failure',
  props<{ error: string }>()
);

// ===========================
// Graph State Actions
// ===========================

export const saveGraphPositions = createAction(
  '[PKG Interest] Save Graph Positions',
  props<{ positions: { [nodeId: string]: { x: number; y: number } } }>()
);

export const clearGraphPositions = createAction(
  '[PKG Interest] Clear Graph Positions'
);

export const setGraphLayout = createAction(
  '[PKG Interest] Set Graph Layout',
  props<{ layout: 'cose' | 'preset' | 'circle' | 'grid' }>()
);

export const setGraphZoomPan = createAction(
  '[PKG Interest] Set Graph Zoom Pan',
  props<{ zoom: number; pan: { x: number; y: number } }>()
);

export const setLastEditedConcept = createAction(
  '[PKG Interest] Set Last Edited Concept',
  props<{ conceptId: string | null }>()
);

// ===========================
// Concept Selection Actions
// ===========================

export const selectConcept = createAction(
  '[PKG Interest] Select Concept',
  props<{ concept: SelectedConcept }>()
);

export const deselectConcept = createAction(
  '[PKG Interest] Deselect Concept'
);

// ===========================
// Panel Visibility Actions
// ===========================

export const setConceptDetailsPanelVisibility = createAction(
  '[PKG Interest] Set Concept Details Panel Visibility',
  props<{ visible: boolean }>()
);

export const setCourseDetailsPanelVisibility = createAction(
  '[PKG Interest] Set Course Details Panel Visibility',
  props<{ visible: boolean }>()
);

export const setHelpDialogVisibility = createAction(
  '[PKG Interest] Set Help Dialog Visibility',
  props<{ visible: boolean }>()
);

// ===========================
// Legend Visibility Actions
// ===========================

export const setLegendVisibility = createAction(
  '[PKG Interest] Set Legend Visibility',
  props<{ legends: Partial<LegendVisibility> }>()
);

export const resetLegendVisibility = createAction(
  '[PKG Interest] Reset Legend Visibility'
);

// ===========================
// Return View Mode Actions
// ===========================

export const setReturnViewMode = createAction(
  '[PKG Interest] Set Return View Mode',
  props<{ viewMode: 'interest' | 'engagement' | 'knowledge' | null }>()
);

export const clearReturnViewMode = createAction(
  '[PKG Interest] Clear Return View Mode'
);

// ===========================
// Clear State
// ===========================

export const clearInterestGraph = createAction(
  '[PKG Interest] Clear Interest Graph'
);
