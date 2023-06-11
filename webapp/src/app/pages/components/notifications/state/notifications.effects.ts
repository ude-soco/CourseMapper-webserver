import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { map, tap } from 'rxjs';
import { Observable, mergeMap } from 'rxjs';
import { NotificationsService } from 'src/app/services/notifications.service';
import * as NotificationActions from './notifications.actions';
import { Action } from '@ngrx/store';

@Injectable()
export class NotificationEffects {
  constructor(
    private actions$: Actions,
    private notificationService: NotificationsService
  ) {}

  //Todo Error handling
  getNotifications$ = createEffect(
    (): Observable<Action> =>
      this.actions$.pipe(
        ofType('[Notification] Load Notifications'),
        tap(() => console.log('In Effect: Fetching notifications')),
        mergeMap(() =>
          this.notificationService
            .getAllNotifications()
            .pipe(
              map((notifications: any) =>
                NotificationActions.loadNotificationsSuccess({ notifications })
              )
            )
        )
      )
  );
}
