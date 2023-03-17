import { createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state';
import * as VideoActions from './video.action'
export interface State extends AppState.State {
  videos: VideoState
}

export interface VideoState {
  isBrushSelectionActive: boolean;
  videoPlayed: boolean;
  videoPaused: boolean;
  test: any;
}

const initialState: VideoState = {
  isBrushSelectionActive: false,
  videoPlayed: false,
  videoPaused: true,
  test: null
}

const getVideoFeatureState =
  createFeatureSelector<VideoState>('video');

export const getIsBrushSelectionActive = createSelector(
  getVideoFeatureState,
  (state) => state.isBrushSelectionActive
);

export const getIsVideoPlayed = createSelector(
  getVideoFeatureState,
  (state) => state.videoPlayed
);

export const getIsVideoPaused = createSelector(
  getVideoFeatureState,
  (state) => state.videoPaused
);

export const videoReducer = createReducer<VideoState>(
  initialState,
  on(VideoActions.setIsBrushSelectionActive, (state, action): VideoState => {
    return {
      ...state,
      isBrushSelectionActive: action.isBrushSelectionActive,
    };
  }),

  on(VideoActions.PlayVideo, (state, action): VideoState => {
    return {
      ...state,
      videoPlayed: true,
      videoPaused: false
    };
  }),

  on(VideoActions.PauseVideo, (state, action): VideoState => {
    return {
      ...state,
      videoPlayed: false,
      videoPaused: true
    };
  }),
)