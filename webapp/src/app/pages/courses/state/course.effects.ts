import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import * as CourseActions from 'src/app/pages/courses/state/course.actions'
import { State, getSelectedChannel } from './course.reducer';
import { Injectable } from '@angular/core';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { withLatestFrom, switchMap, mergeMap, catchError, of, filter } from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LoggerService } from 'src/app/services/logger.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
@Injectable()
export class CourseEffects {
  getTags$ = createEffect(() =>
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
        this.TopicChannelService.getAllTagsForCurrentChannel(channel).pipe(
          mergeMap((tags) => [CourseActions.LoadTagsSuccess({ tags }),]),
          catchError((error) =>
            of(CourseActions.LoadTagsFail({ error }))
          )
        ),
      )
    )
  );

  constructor(
    private actions$: Actions,
    private TopicChannelService: TopicChannelService,
    private loggerService: LoggerService,
    private store: Store<State>
  ) { }
}