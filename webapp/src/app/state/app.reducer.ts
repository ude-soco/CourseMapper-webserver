import { createFeatureSelector, createReducer, createSelector, on } from "@ngrx/store";
import * as AppActions from 'src/app/state/app.actions'
import * as AppState from 'src/app/state/app.state'

export interface State extends AppState.State {
    generalState: GeneralState
}

export interface GeneralState{
    courseSelected: boolean,
}

const initialState: GeneralState = {
    courseSelected: false
}

const getAppFeatureState = createFeatureSelector<GeneralState>('general');

export const getCourseSelected = createSelector(
    getAppFeatureState,
    state => state.courseSelected
  );

  export const appReducer = createReducer<GeneralState>(
    initialState,
    on(AppActions.toggleCourseSelected, (state, action): GeneralState => {
      return {
        ...state,
        courseSelected: action.courseSelected
      };
    }),
  );