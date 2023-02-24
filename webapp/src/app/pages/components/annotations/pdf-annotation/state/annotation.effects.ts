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
          mergeMap((postedAnnotaion) => [
            AnnotationActions.postAnnotationSuccess(),
            // AnnotationActions.loadAnnotations(),
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
                map(
                  (replies) =>
                    ({ ...annotation, replies: replies } as Annotation)
                )
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

  postReply$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.postReply),
      mergeMap(({ annotation, reply }) =>
        this.annotationService.postReply(annotation, reply).pipe(
          mergeMap(() => [
            AnnotationActions.postReplySuccess(),
            // AnnotationActions.loadAnnotations(),
          ]),
          catchError((error) => of(AnnotationActions.postReplyFail({ error })))
        )
      )
    )
  );

  likeAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.likeAnnotation),
      mergeMap(({ annotation }) =>
        this.annotationService.likeAnnotation(annotation).pipe(
          mergeMap(() => [
            AnnotationActions.likeAnnotationSuccess(),
          ]),
          catchError((error) =>
            of(AnnotationActions.likeAnnotationFail({ error }))
          )
        )
      )
    )
  );

  dislikeAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.dislikeAnnotation),
      mergeMap(({ annotation }) =>
        this.annotationService.dislikeAnnotation(annotation).pipe(
          mergeMap(() => [
            AnnotationActions.dislikeAnnotationSuccess(),
          ]),
          catchError((error) =>
            of(AnnotationActions.dislikeAnnotationFail({ error }))
          )
        )
      )
    )
  );

  likeReply$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AnnotationActions.likeReply),
    mergeMap(({ reply }) =>
      this.annotationService.likeReply(reply).pipe(
        mergeMap(() => [
          AnnotationActions.likeReplySuccess(),
        ]),
        catchError((error) =>
          of(AnnotationActions.likeReplyFail({ error }))
        )
      )
    )
  )
);

dislikeReply$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AnnotationActions.dislikeReply),
    mergeMap(({ reply }) =>
      this.annotationService.dislikeReply(reply).pipe(
        mergeMap(() => [
          AnnotationActions.dislikeReplySuccess(),
        ]),
        catchError((error) =>
          of(AnnotationActions.dislikeReplyFail({ error }))
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
