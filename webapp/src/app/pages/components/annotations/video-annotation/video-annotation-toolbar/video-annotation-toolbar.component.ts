import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { getIsVideoPaused, getIsVideoPlayed, State } from '../state/video.reducer';
import * as VideoActions from '../state/video.action'
import { Observable } from 'rxjs';

@Component({
  selector: 'app-video-annotation-toolbar',
  templateUrl: './video-annotation-toolbar.component.html',
  styleUrls: ['./video-annotation-toolbar.component.css']
})
export class VideoAnnotationToolbarComponent {
  isVideoPlayed$: Observable<boolean>;
  isVideoPaused$: Observable<boolean>;
  constructor(private store: Store<State>){

  }

  OnDrawToolSelection(){
    this.store.dispatch(VideoActions.setIsBrushSelectionActive({isBrushSelectionActive: true}));
  }

  OnPinToolSelection(){
    this.store.dispatch(VideoActions.setIsPinpointSelectionActive({isPinpointSelectionActive: true}));
  }

}
