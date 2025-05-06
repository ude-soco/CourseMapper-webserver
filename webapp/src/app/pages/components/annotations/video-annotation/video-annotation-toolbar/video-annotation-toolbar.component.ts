import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  getIsVideoPaused,
  getIsVideoPlayed,
  getShowAnnotations,
  State,
} from '../state/video.reducer';
import * as VideoActions from '../state/video.action';
import { Observable, Subscription } from 'rxjs';
import { Annotation } from 'src/app/models/Annotations';
import { getAnnotationsForMaterial } from '../../pdf-annotation/state/annotation.reducer';
import { getCurrentMaterialId } from '../../../materials/state/materials.reducer';
import { getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';
import { AnnotationService } from 'src/app/services/annotation.service';

@Component({
  selector: 'app-video-annotation-toolbar',
  templateUrl: './video-annotation-toolbar.component.html',
  styleUrls: ['./video-annotation-toolbar.component.css'],
})
export class VideoAnnotationToolbarComponent {
  isVideoPlayed$: Observable<boolean>;
  isVideoPaused$: Observable<boolean>;
  showAnnotations: boolean;
  allAnnotations: Annotation[] = [];
  annotationsSubscription: Subscription | undefined;
  materialId: string;
  courseId: string;
  constructor(
    private store: Store<State>,
    private annotationService: AnnotationService
  ) {
    this.store
      .select(getShowAnnotations)
      .subscribe((isShow) => (this.showAnnotations = isShow));
    this.annotationsSubscription = this.store
      .select(getAnnotationsForMaterial)
      .subscribe((annotations) => {
        this.allAnnotations = annotations;
      });
    this.store.select(getCurrentMaterialId).subscribe((id) => {
      this.materialId = id;
    });

    this.store.select(getCurrentCourseId).subscribe((id) => {
      this.courseId = id;
    });
  }

  OnDrawToolSelection() {
    this.store.dispatch(
      VideoActions.setIsBrushSelectionActive({ isBrushSelectionActive: true })
    );
  }

  OnPinToolSelection() {
    this.store.dispatch(
      VideoActions.setIsPinpointSelectionActive({
        isPinpointSelectionActive: true,
      })
    );
  }

  showHideAnnotations() {
    //log the activities User hid/unhid annotations in a video
    const relevantAnnotations = this.allAnnotations.filter((annotation) =>
      ['pin', 'brush'].includes(annotation.tool.type)
    ); // The annotations object includes just the annotations that were done inside a video
    const payload = {
      materialId: this.materialId,
      courseId: this.courseId,
      annotations: relevantAnnotations,
    };

    if (this.showAnnotations) {
      this.store.dispatch(
        VideoActions.SetShowAnnotations({ showAnnotations: false })
      );
      //Hide annotations from a video
      this.annotationService.hideAnnotations(payload).subscribe();
    } else {
      this.store.dispatch(
        VideoActions.SetShowAnnotations({ showAnnotations: true })
      );
      //Unhide annotations from a video
      this.annotationService.unhideAnnotations(payload).subscribe();
    }
  }
}
