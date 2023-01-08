import { Injectable } from '@angular/core';
import {Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, mergeMap, of, switchMap } from 'rxjs';
import { AnnotationService } from 'src/app/services/annotation.service';
import * as AnnotationActions from './annotation.actions'

@Injectable()
export class AnnotationEffects {
  postAnnotation$ = createEffect(() =>
    this.actions$.pipe(
      ofType(AnnotationActions.postAnnotation),
      switchMap(({ annotation }) =>
        this.annotationService.postAnnotation(annotation).pipe(
          map(() => AnnotationActions.postAnnotationSuccess()),
          catchError((error) => of(AnnotationActions.postAnnotationFail({ error })))
        )
      )
    )
  );

  getAnnotations$ = createEffect(() =>
  this.actions$.pipe(
    ofType(AnnotationActions.loadAnnotations),
    switchMap(({material}) =>
      this.annotationService.getAllAnnotations(material).pipe(
        map(annotations => AnnotationActions.loadAnnotationsSuccess({annotations})),
        catchError((error) => of(AnnotationActions.loadAnnotationsFail({ error })))
      )
    )
  )
);

  constructor(private actions$: Actions, private annotationService: AnnotationService) {}
}