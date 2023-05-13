import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Action, Store } from '@ngrx/store';
import {
  catchError,
  first,
  forkJoin,
  from,
  map,
  mergeMap,
  of,
  switchMap,
  tap,
  toArray,
  withLatestFrom,
} from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import { State } from 'src/app/state/app.state';
import {
  getCurrentMaterialId,
} from '../../../materials/state/materials.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import * as MaterialActions from '../../../materials/state/materials.actions';
import * as VideoActions from 'src/app/pages/components/annotations/video-annotation/state/video.action'
import { Annotation } from 'src/app/models/Annotations';
import { LoggerService } from 'src/app/services/logger.service';
import { getCurrentTime } from '../../video-annotation/state/video.reducer';
import { getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';

@Injectable()
export class VideoEffects {

logVideoPlayed$ = createEffect(() =>
  this.actions$.pipe(
    ofType(VideoActions.PlayVideo),
    withLatestFrom(
      this.store.select(getCurrentCourseId),
      this.store.select(getCurrentMaterialId),
      this.store.select(getCurrentTime)
    ),
    tap(([action, courseId, materialId, time]) => {
      const seconds = time % 60;
      const minutes = Math.floor(time / 60) % 60;
      const hours = Math.floor(time / 3600);
      this.loggerService.videoPlayed(courseId, materialId, hours, minutes, seconds);
    })
  ),
  { dispatch: false }
);

logVideoPaused$ = createEffect(() =>
  this.actions$.pipe(
    ofType(VideoActions.PauseVideo),
    withLatestFrom(
      this.store.select(getCurrentCourseId),
      this.store.select(getCurrentMaterialId),
      this.store.select(getCurrentTime)
    ),
    tap(([action, courseId, materialId, time]) => {
      const seconds = time % 60;
      const minutes = Math.floor(time / 60) % 60;
      const hours = Math.floor(time / 3600);
      this.loggerService.videoPuased(courseId, materialId, hours, minutes, seconds);
    })
  ),
  { dispatch: false }
);

logVideoCompleted$ = createEffect(() =>
  this.actions$.pipe(
    ofType(VideoActions.VideoCompleted),
    withLatestFrom(
      this.store.select(getCurrentCourseId),
      this.store.select(getCurrentMaterialId),
    ),
    tap(([action, courseId, materialId]) => {
      this.loggerService.videoCompleted(courseId, materialId);
    })
  ),
  { dispatch: false }
);

  constructor(
    private actions$: Actions,
    private annotationService: AnnotationService,
    private loggerService: LoggerService,
    private store: Store<State>
  ) {}
}
