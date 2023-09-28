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
import { getCurrentMaterialId } from '../../../materials/state/materials.reducer';
import * as AnnotationActions from './annotation.actions';
import * as MaterialActions from '../../../materials/state/materials.actions';
import * as CourseActions from '../../../../courses/state/course.actions';
import * as VideoActions from 'src/app/pages/components/annotations/video-annotation/state/video.action';
import { Annotation } from 'src/app/models/Annotations';
import { LoggerService } from 'src/app/services/logger.service';
import { getCurrentTime } from '../../video-annotation/state/video.reducer';
import * as NotificationActions from 'src/app/pages/components/notifications/state/notifications.actions';
import {
  getCurrentPdfPage,
  getPdfTotalNumberOfPages,
} from './annotation.reducer';
import { getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';
import { BlockingNotifications } from 'src/app/models/BlockingNotification';

@Injectable()
export class AnnotationEffects {
  postAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.postAnnotation),
      mergeMap(({ annotation, mentionedUsers }) =>
        this.annotationService.postAnnotation(annotation, mentionedUsers).pipe(
          mergeMap((postedAnnotaion) => [
            AnnotationActions.postAnnotationSuccess(),
            CourseActions.followAnnotationSuccess({
              updatedDoc: postedAnnotaion as unknown as BlockingNotifications,
            }),
            /* AnnotationActions.loadAnnotations(), */
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
      mergeMap(({ annotation, reply, mentionedUsers }) =>
        this.annotationService
          .postReply(annotation, reply, mentionedUsers)
          .pipe(
            mergeMap(() => [
              AnnotationActions.postReplySuccess(),
              /* AnnotationActions.loadAnnotations(), */
            ]),
            catchError((error) =>
              of(AnnotationActions.postReplyFail({ error }))
            )
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
            /* AnnotationActions.loadAnnotations(), */
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
            /* AnnotationActions.loadAnnotations(), */
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
            /* AnnotationActions.loadAnnotations(), */
          ]),
          catchError((error) => of(AnnotationActions.likeReplyFail({ error })))
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
            /* AnnotationActions.loadAnnotations(), */
          ]),
          catchError((error) =>
            of(AnnotationActions.dislikeReplyFail({ error }))
          )
        )
      )
    )
  );

  deleteReply$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.deleteReply),
      mergeMap(({ reply }) =>
        this.annotationService.deleteReply(reply).pipe(
          mergeMap(() => [
            AnnotationActions.deleteReplySuccess(),
            NotificationActions.isDeletingReply({
              replyId: reply._id,
            }),
            /* AnnotationActions.loadAnnotations(), */
          ]),
          catchError((error) =>
            of(AnnotationActions.deleteReplyFail({ error }))
          )
        )
      )
    )
  );

  editReply$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.editReply),
      mergeMap(({ reply, updatedReply }) =>
        this.annotationService.editReply(reply, updatedReply).pipe(
          mergeMap(() => [
            AnnotationActions.editReplySuccess(),
            /* AnnotationActions.loadAnnotations(), */
          ]),
          catchError((error) => of(AnnotationActions.editReplyFail({ error })))
        )
      )
    )
  );

  deleteAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.deleteAnnotation),
      mergeMap(({ annotation }) =>
        this.annotationService.deleteAnnotation(annotation).pipe(
          mergeMap(() => [
            AnnotationActions.deleteAnnotationSuccess(),
            /* AnnotationActions.loadAnnotations(), */
            NotificationActions.isDeletingAnnotation({
              annotationId: annotation._id,
            }),
          ]),
          catchError((error) =>
            of(AnnotationActions.deleteAnnotationFail({ error }))
          )
        )
      )
    )
  );

  editAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.editAnnotation),
      mergeMap(({ annotation }) =>
        this.annotationService.editAnnotation(annotation).pipe(
          mergeMap(() => [
            AnnotationActions.editAnnotationSuccess(),
            /* AnnotationActions.loadAnnotations(), */
          ]),
          catchError((error) =>
            of(AnnotationActions.editAnnotationFail({ error }))
          )
        )
      )
    )
  );

  logSlideSeen$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(AnnotationActions.setCurrentPdfPage),
        withLatestFrom(
          this.store.select(getCurrentCourseId),
          this.store.select(getCurrentMaterialId),
          this.store.select(getCurrentPdfPage),
          this.store.select(getPdfTotalNumberOfPages)
        ),
        tap(([action, courseId, materialId, pageNumber, totalPages]) => {
          this.loggerService.slideSeen(courseId, materialId, pageNumber);
          if (pageNumber === totalPages) {
            this.loggerService.pdfCompleted(courseId, materialId);
          }
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
