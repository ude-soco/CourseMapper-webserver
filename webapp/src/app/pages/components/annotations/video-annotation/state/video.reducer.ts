import { createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import { Annotation } from 'src/app/models/Annotations';
import { DrawingData } from 'src/app/models/Drawing';
import * as AppState from 'src/app/state/app.state';
import * as VideoActions from './video.action'
export interface State extends AppState.State {
  videos: VideoState
}

export interface VideoState {
  isBrushSelectionActive: boolean;
  isPinpointSelectionActive: boolean;
  videoPlayed: boolean;
  videoPaused: boolean;
  videoDuration: number;
  currentTime: number;
  isAnnotationDialogVisible: boolean;
  isAnnotationCreationCanceled: boolean;
  drawingData: DrawingData;
  pinpointPosition: [number, number];
  activeAnnotation: Annotation;
  showAnnotations: boolean;
  seekVideo: [number, number];
}

const initialState: VideoState = {
  isBrushSelectionActive: false,
  isPinpointSelectionActive: false,
  videoPlayed: false,
  videoPaused: true,
  videoDuration: 0,
  currentTime: 0,
  isAnnotationDialogVisible: false,
  isAnnotationCreationCanceled: false,
  drawingData: null,
  pinpointPosition: [null, null],
  activeAnnotation: null,
  showAnnotations: true,
  seekVideo: null,
}

const getVideoFeatureState =
  createFeatureSelector<VideoState>('video');

export const getIsBrushSelectionActive = createSelector(
  getVideoFeatureState,
  (state) => state.isBrushSelectionActive
);

export const getIsPinpointSelectionActive = createSelector(
  getVideoFeatureState,
  (state) => state.isPinpointSelectionActive
);

export const getIsVideoPlayed = createSelector(
  getVideoFeatureState,
  (state) => state.videoPlayed
);

export const getIsVideoPaused = createSelector(
  getVideoFeatureState,
  (state) => state.videoPaused
);

export const getVideoDuration = createSelector(
  getVideoFeatureState,
  (state) => state.videoDuration
);

export const getCurrentTime = createSelector(
  getVideoFeatureState,
  (state) => state.currentTime
);

export const getIsAnnotationDialogVisible = createSelector(
  getVideoFeatureState,
  (state) => state.isAnnotationDialogVisible
);

export const getIsAnnotationCreationCanceled = createSelector(
  getVideoFeatureState,
  (state) => state.isAnnotationCreationCanceled
);

export const getDrawingData = createSelector(
  getVideoFeatureState,
  (state) => state.drawingData
);

export const getPinPointPosition = createSelector(
  getVideoFeatureState,
  (state) => state.pinpointPosition
);

export const getActiveAnnotation = createSelector(
  getVideoFeatureState,
  (state) => state.activeAnnotation
);

export const getShowAnnotations = createSelector(
  getVideoFeatureState,
  (state) => state.showAnnotations
);

export const getSeekVideo = createSelector(
  getVideoFeatureState,
  (state) => state.seekVideo
);

export const videoReducer = createReducer<VideoState>(
  initialState,
  on(VideoActions.setIsBrushSelectionActive, (state, action): VideoState => {
    return {
      ...state,
      isBrushSelectionActive: action.isBrushSelectionActive,
    };
  }),

  on(VideoActions.setIsPinpointSelectionActive, (state, action): VideoState => {
    return {
      ...state,
      isPinpointSelectionActive: action.isPinpointSelectionActive,
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

  on(VideoActions.SetVideoDuration, (state, action): VideoState => {
    return {
      ...state,
      videoDuration: action.videoDuration,
    };
  }),

  on(VideoActions.SetCurrentTime, (state, action): VideoState => {
    return {
      ...state,
      currentTime: action.currentTime,
    };
  }),

  on(VideoActions.SetIsAnnotationDialogVisible, (state, action): VideoState => {
    return {
      ...state,
      isAnnotationDialogVisible: action.isAnnotationDialogVisible,
    };
  }),

  on(VideoActions.SetIsAnnotationCreationCanceled, (state, action): VideoState => {
    if(action.isAnnotationCreationCanceled){
      return {
        ...state,
        isAnnotationDialogVisible: false,
        isAnnotationCreationCanceled: true
      };
    }else{
      return {
        ...state,
        isAnnotationCreationCanceled: false
      };  
    }
  }),

  on(VideoActions.SetDrawingData, (state, action): VideoState => {
    return {
      ...state,
      drawingData: action.drawingData,
    };
  }),

  on(VideoActions.SetPinPointPosition, (state, action): VideoState => {
    return {
      ...state,
      pinpointPosition: action.pinpointPosition,
    };
  }),

  on(VideoActions.SetActiveAnnotaion, (state, action): VideoState => {
    return {
      ...state,
      activeAnnotation: action.activeAnnotation,
    };
  }),

  on(VideoActions.SetShowAnnotations, (state, action): VideoState => {
    return {
      ...state,
      showAnnotations: action.showAnnotations,
    };
  }),

  on(VideoActions.SetSeekVideo, (state, action): VideoState => {
    return {
      ...state,
      seekVideo: action.seekVideo,
    };
  }),
)