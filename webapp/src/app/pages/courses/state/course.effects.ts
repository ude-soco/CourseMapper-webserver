import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import * as CourseActions from 'src/app/pages/courses/state/course.actions'
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions'
import { getCurrentCourse, getSelectedChannel, getSelectedTag, getSelectedTopic } from './course.reducer';
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
import { State } from 'src/app/state/app.reducer';
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

  getAnnotationsForTag$ = createEffect(() =>
  this.actions$.pipe(
    filter(
      (action) =>
        action.type === CourseActions.loadAnnotationsForSelectedTag.type
    ),
    withLatestFrom(
      this.store.select(getCurrentCourse),
      this.store.select(getSelectedTag)
    ),
    filter(([action, course, tag]) => !!course && !!tag),
    switchMap(([action, course, tag]) =>
      this.TagService.getAllAnnotationsForTag(course, tag).pipe(
        mergeMap((annotations) => [CourseActions.loadAnnotationsForSelectedTagSuccess({ annotations: annotations}),]),
        catchError((error) =>
          of(CourseActions.loadAnnotationsForSelectedTagFail({ error }))
        )
      ),
    )
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