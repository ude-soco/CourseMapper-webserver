import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import * as CourseActions from 'src/app/pages/courses/state/course.actions'
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions'
import { State, getCurrentCourse, getSelectedChannel, getSelectedTopic } from './course.reducer';
import { Injectable } from '@angular/core';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { withLatestFrom, switchMap, mergeMap, catchError, of, filter, EMPTY } from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LoggerService } from 'src/app/services/logger.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { TagService } from 'src/app/services/tag.service';
import { getCurrentMaterial } from '../../components/materials/state/materials.reducer';
import { Router } from '@angular/router';
@Injectable()
export class CourseEffects {
  getTagsForCourse$ = createEffect(() =>
  this.actions$.pipe(
    filter(
      (action) =>
        action.type === CourseActions.setCurrentCourse.type ||
        action.type === AnnotationActions.postAnnotationSuccess.type ||
        action.type === AnnotationActions.postReplySuccess.type ||
        action.type === AnnotationActions.deleteAnnotationSuccess.type ||
        action.type === AnnotationActions.deleteReplySuccess.type
    ),
    withLatestFrom(
      this.store.select(getCurrentCourse),
    ),
    filter(([action, course]) => !!course),
    switchMap(([action, course]) =>
      this.TagService.getAllTagsForCurrentCourse(course).pipe(
        mergeMap((tags) => [CourseActions.LoadTagsSuccess({ tags: tags, tagsFor: 'course' }),]),
        catchError((error) =>
          of(CourseActions.LoadTagsFail({ error }))
        )
      ),
    )
  )
);

  getTagsForTopic$ = createEffect(() =>
  this.actions$.pipe(
    filter(
      (action) =>
        action.type === CourseActions.setCurrentTopic.type ||
        action.type === AnnotationActions.postAnnotationSuccess.type ||
        action.type === AnnotationActions.postReplySuccess.type ||
        action.type === AnnotationActions.deleteAnnotationSuccess.type ||
        action.type === AnnotationActions.deleteReplySuccess.type
    ),
    withLatestFrom(
      this.store.select(getSelectedTopic),
    ),
    filter(([action, topic]) => !!topic),
    switchMap(([action, topic]) =>
      this.TagService.getAllTagsForCurrentTopic(topic).pipe(
        mergeMap((tags) => [CourseActions.LoadTagsSuccess({ tags: tags, tagsFor: 'topic' }),]),
        catchError((error) =>
          of(CourseActions.LoadTagsFail({ error }))
        )
      ),
    )
  )
);

  getTagsForChannel$ = createEffect(() =>
    this.actions$.pipe(
      filter(
        (action) =>
          action.type === CourseActions.SetSelectedChannel.type ||
          action.type === AnnotationActions.postAnnotationSuccess.type ||
          action.type === AnnotationActions.postReplySuccess.type ||
          action.type === AnnotationActions.deleteAnnotationSuccess.type ||
          action.type === AnnotationActions.deleteReplySuccess.type
      ),
      withLatestFrom(
        this.store.select(getSelectedChannel),
      ),
      filter(([action, channel]) => !!channel),
      switchMap(([action, channel]) =>
        this.TagService.getAllTagsForCurrentChannel(channel).pipe(
          mergeMap((tags) => [CourseActions.LoadTagsSuccess({ tags: tags, tagsFor: 'channel' }),]),
          catchError((error) =>
            of(CourseActions.LoadTagsFail({ error }))
          )
        ),
      )
    )
  );

getTagsForMaterial$ = createEffect(() =>
  this.actions$.pipe(
    filter(
      (action) =>
        action.type === MaterialActions.setCurrentMaterial.type ||
        action.type === AnnotationActions.postAnnotationSuccess.type ||
        action.type === AnnotationActions.postReplySuccess.type ||
        action.type === AnnotationActions.deleteAnnotationSuccess.type ||
        action.type === AnnotationActions.deleteReplySuccess.type
    ),
    switchMap(() => {
            // Check if the module is loaded
            const url = this.router.url;
            if (!url.includes('material')){
              // If the module is not loaded, return an empty observable
              return EMPTY;
            }
      return this.store.select(getCurrentMaterial).pipe(
        filter((material) => !!material),
        switchMap((material) =>
          this.TagService.getAllTagsForCurrentMaterial(material).pipe(
            mergeMap((tags) => [CourseActions.LoadTagsSuccess({ tags: tags, tagsFor: 'material' })]),
            catchError((error) =>
              of(CourseActions.LoadTagsFail({ error }))
            )
          )
        )
      );
    })
  )
);


  constructor(
    private actions$: Actions,
    private TagService: TagService,
    private loggerService: LoggerService,
    private store: Store<State>,
    private router: Router
  ) { }
}