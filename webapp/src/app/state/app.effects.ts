import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { State } from './app.state';
import { createEffect, ofType, Actions } from '@ngrx/effects';
import * as ApplicationActions from './app.actions';
import {
  withLatestFrom,
  switchMap,
  mergeMap,
  catchError,
  of,
  filter,
  EMPTY,
  forkJoin,
  map,
  tap,
  last,
} from 'rxjs';
import { UserServiceService } from '../services/user-service.service';

@Injectable()
export class AppEffects {
  constructor(
    private store: Store<State>,
    private actions$: Actions,
    private userService: UserServiceService
  ) {}

  getLastTimeCourseMapperOpened$ = createEffect(() => {
    return this.actions$.pipe(
      ofType(ApplicationActions.getLastTimeCourseMapperOpened),
      switchMap((action) => {
        return this.userService
          .getlastTimeCourseMapperOpened()
          .pipe(
            map((lastTimeCourseMapperOpened) =>
              ApplicationActions.getLastTimeCourseMapperOpenedSuccess(
                lastTimeCourseMapperOpened
              )
            )
          );
      })
    );
  });
}
