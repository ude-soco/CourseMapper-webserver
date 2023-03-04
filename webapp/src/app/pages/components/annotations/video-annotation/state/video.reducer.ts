import { createFeatureSelector, createReducer } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state';
export interface State extends AppState.State{
    videos: VideoState
}

export interface VideoState {
play:boolean;
Puse:boolean;
}

const initialState: VideoState = {
play:false,
Puse:true,
}

const getVideoFeatureState =
  createFeatureSelector<VideoState>('video');


  export const videoReducer = createReducer<VideoState>(
    initialState,)