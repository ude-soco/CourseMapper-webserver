import { createAction, createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state'
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'
import { PdfToolType } from 'src/app/models/Annotations';

// Strongly typed state
export interface State extends AppState.State{
    annotations: AnnotationState;
}

export interface AnnotationState {
  highlightSelected: boolean,
  selectedTool: PdfToolType,
  createAnnotationFromPanel: boolean
}

const initialState: AnnotationState = {
  highlightSelected: false,
  selectedTool: PdfToolType.None,
  createAnnotationFromPanel: true
}

const getAnnotationFeatureState = createFeatureSelector<AnnotationState>('annotation');

export const isHighlightSelected = createSelector(
  getAnnotationFeatureState,
  state => state.highlightSelected
);

export const getSelectedTool = createSelector(
  getAnnotationFeatureState,
  state => state.selectedTool
);

export const getCreateAnnotationFromPanel = createSelector(
  getAnnotationFeatureState,
  state => state.createAnnotationFromPanel
);


export const annotationReducer = createReducer<AnnotationState>(
    initialState,
    on(AnnotationActions.toggleHighlightSelected, (state): AnnotationState => {
      return {
        ...state,
        highlightSelected: !state.highlightSelected
      };
    }),

    on(AnnotationActions.setSelectedTool, (state, action): AnnotationState => {
      return {
        ...state,
        selectedTool: action.selectedTool
      };
    }),

    on(AnnotationActions.setCreateAnnotationFromPanel, (state, action): AnnotationState => {
      return {
        ...state,
        createAnnotationFromPanel: action.createAnnotationFromPanel
      };
    }),
  );