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
  getCurrentCourseId,
  getCurrentMaterialId,
} from '../../../materils/state/materials.reducer';
import * as AnnotationActions from './annotation.actions';
import * as MaterialActions from '../../../materils/state/materials.actions';
import { Annotation } from 'src/app/models/Annotations';

@Injectable()
export class AnnotationEffects {
  postAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.postAnnotation),
      mergeMap(({ annotation }) =>
        this.annotationService.postAnnotation(annotation).pipe(
          mergeMap(() => [
            AnnotationActions.postAnnotationSuccess(),
            AnnotationActions.loadAnnotations(),
          ]),
          catchError((error) =>
            of(AnnotationActions.postAnnotationFail({ error }))
          )
        )
      )
    )
  );

  getAnnotations$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.loadAnnotations),
      withLatestFrom(
        this.store.select(getCurrentCourseId),
        this.store.select(getCurrentMaterialId)
      ),
      switchMap(([action, courseId, materialId]) =>
        this.annotationService.getAllAnnotations(materialId, courseId).pipe(
          mergeMap((annotations) => [
            AnnotationActions.loadAnnotationsSuccess({ annotations }),
            AnnotationActions.loadReplies({ annotations }),
          ]),
          catchError((error) =>
            of(AnnotationActions.loadAnnotationsFail({ error }))
          )
        )
      )
    )
  );

  resetAnnotationStoreValues = createEffect(() =>
    this.actions$.pipe(
      ofType(MaterialActions.setMaterialId),
      mergeMap(() => [AnnotationActions.resetAnnotationStoreValues()])
    )
  );

  loadReplies$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.loadReplies),
      switchMap(({ annotations }) =>
        forkJoin(
          annotations.map((annotation) =>
            this.annotationService
              .getAllReplies(annotation)
              .pipe(
                map((replies) => ({ ...annotation, replies: replies } as Annotation))
              )
          )
        ).pipe(
          map((updatedAnnotations) =>
            AnnotationActions.updateAnnotationsWithReplies({
              annotations: updatedAnnotations,
            })
          ),
          catchError((error) =>
            of(AnnotationActions.updateAnnotationsWithRepliesFail({ error }))
          )
        )
      )
    )
  );
  
  constructor(
    private actions$: Actions,
    private annotationService: AnnotationService,
    private store: Store<State>
  ) {}
}
