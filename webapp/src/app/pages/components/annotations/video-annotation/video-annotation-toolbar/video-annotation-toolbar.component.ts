import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { getIsVideoPaused, getIsVideoPlayed, getShowAnnotations, State } from '../state/video.reducer';
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
  showAnnotations: boolean;
  constructor(private store: Store<State>){
    this.store.select(getShowAnnotations).subscribe((isShow) => this.showAnnotations = isShow);
  }

  OnDrawToolSelection(){
    this.store.dispatch(VideoActions.setIsBrushSelectionActive({isBrushSelectionActive: true}));
  }

  OnPinToolSelection(){
    this.store.dispatch(VideoActions.setIsPinpointSelectionActive({isPinpointSelectionActive: true}));
  }

  showHideAnnotations(){
    if(this.showAnnotations){
      this.store.dispatch(VideoActions.SetShowAnnotations({showAnnotations: false}));
    }else{
      this.store.dispatch(VideoActions.SetShowAnnotations({showAnnotations: true}));
    }
  }

}
