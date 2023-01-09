import { createAction, createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state'
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'

// Strongly typed state
export interface State extends AppState.State{
    annotations: AnnotationState;
}

export interface AnnotationState {
  highlightSelected: boolean,
  selectedTool: string
}

const initialState: AnnotationState = {
  highlightSelected: false,
  selectedTool: "none"
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
  );