import { Injectable } from '@angular/core';
import {Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, switchMap } from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import * as AnnotationActions from './annotation.actions'

@Injectable()
export class AnnotationEffects {
  postAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.createAnnotation),
      switchMap(({ annotation }) =>
        this.annotationService.createAnnotation(annotation).pipe(
          map(() => AnnotationActions.createAnnotationSucess()),
          catchError((error) => of(AnnotationActions.createAnnotationFail({ error })))
        )
      )
    )
  );

  constructor(private actions$: Actions, private annotationService: AnnotationService) {}
}