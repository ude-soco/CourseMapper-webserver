import { createAction, createFeatureSelector, createReducer, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state'


export interface State extends AppState.State{
    materials: MaterialState;
}

export interface MaterialState {

}

const initialState: MaterialState = {

}

const getMaterialFeatureState = createFeatureSelector<MaterialState>('material');


export const materialReducer = createReducer<MaterialState>(
    initialState,
    on(createAction('Empty action string'), (state): MaterialState => {
      return {
        ...state,
      };
    })
  );