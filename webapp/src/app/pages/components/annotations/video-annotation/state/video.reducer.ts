import { createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state';
import * as VideoActions from './video.action'
export interface State extends AppState.State {
  videos: VideoState
}

export interface VideoState {
  play: boolean;
  Puse: boolean;
  isBrushSelectionActive: boolean;
}

const initialState: VideoState = {
  play: false,
  Puse: true,
  isBrushSelectionActive: true
}

const getVideoFeatureState =
  createFeatureSelector<VideoState>('video');

  export const getIsBrushSelectionActive = createSelector(
    getVideoFeatureState,
    (state) => state.isBrushSelectionActive
  );


export const videoReducer = createReducer<VideoState>(
  initialState,
  on(VideoActions.setIsBrushSelectionActive, (state, action): VideoState => {
    return {
      ...state,
      isBrushSelectionActive: action.isBrushSelectionActive,
    };
  }),
  )