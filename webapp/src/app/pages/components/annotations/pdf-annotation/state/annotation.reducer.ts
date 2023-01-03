import { createAction, createFeatureSelector, createReducer, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state'

// Strongly typed state
export interface State extends AppState.State{
    annotations: AnnotationState;
}

export interface AnnotationState {

}

const initialState: AnnotationState = {

}

const getAnnotationFeatureState = createFeatureSelector<AnnotationState>('annotation');


export const annotationReducer = createReducer<AnnotationState>(
    initialState,
    on(createAction('Empty action string'), (state): AnnotationState => {
      return {
        ...state,
      };
    })
  );