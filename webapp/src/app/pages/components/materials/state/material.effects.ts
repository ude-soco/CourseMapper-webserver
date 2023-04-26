import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import * as CourseActions from 'src/app/pages/courses/state/course.actions'
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions'
import { Injectable } from '@angular/core';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { withLatestFrom, switchMap, mergeMap, catchError, of, filter, EMPTY } from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import { LoggerService } from 'src/app/services/logger.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { TagService } from 'src/app/services/tag.service';
import { Router } from '@angular/router';
import { State, getCurrentMaterial } from './materials.reducer';
@Injectable()
export class MaterialEffects {

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
      withLatestFrom(
        this.store.select(getCurrentMaterial),
      ),
      filter(([action, material]) => !!material),
      switchMap(([action, material]) =>
        this.TagService.getAllTagsForCurrentMaterial(material).pipe(
          mergeMap((tags) => [MaterialActions.LoadTagsSuccessForMaterial({ tags: tags})]),
          catchError((error) =>
            of(MaterialActions.LoadTagsFailForMaterial({ error }))
          )
        ),
      )
    )
  );


  constructor(
    private actions$: Actions,
    private TagService: TagService,
    private store: Store<State>,
  ) { }
}