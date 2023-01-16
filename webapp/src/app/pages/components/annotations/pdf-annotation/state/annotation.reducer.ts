import { createAction, createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state'
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'
import { AnnotationTool, AnnotationType, PdfToolType } from 'src/app/models/Annotations';

// Strongly typed state
export interface State extends AppState.State{
    annotations: AnnotationState;
}

export interface AnnotationState {
  highlightSelected: boolean,
  selectedTool: PdfToolType,
  createAnnotationFromPanel: boolean,
  selectedAnnotationType: AnnotationType;
  annotationContent: string
}

const initialState: AnnotationState = {
  highlightSelected: false,
  selectedTool: PdfToolType.None,
  createAnnotationFromPanel: true,
  selectedAnnotationType: null,
  annotationContent: null
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

export const getSelectedAnnotationType = createSelector(
  getAnnotationFeatureState,
  state => state.selectedAnnotationType
);

export const getAnnotationContent = createSelector(
  getAnnotationFeatureState,
  state => state.annotationContent
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

    on(AnnotationActions.setSelectedAnnotationType, (state, action): AnnotationState => {
      return {
        ...state,
        selectedAnnotationType: action.selectedAnnotationType
      };
    }),

    on(AnnotationActions.setAnnotationContent, (state, action): AnnotationState => {
      return {
        ...state,
        annotationContent: action.annotationContent
      };
    }),
  );