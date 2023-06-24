import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, tap } from 'rxjs';
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
        ofType(NotificationActions.loadNotifications),
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

  //make effect for marking a notification as read
  markNotificationAsRead$ = createEffect(
    (): Observable<Action> =>
      this.actions$.pipe(
        ofType(NotificationActions.notificationsMarkedAsRead),
        tap(() => console.log('In Effect: Marking notification as read')),
        mergeMap((action) =>
          this.notificationService
            .markNotificationAsRead(action.notifications)
            .pipe(
              map((successMsg: { message: string }) =>
                NotificationActions.notificationsMarkedAsReadSuccess()
              ),
              catchError((error) => {
                console.log(error);
                return of(
                  NotificationActions.notificationsMarkedAsReadFailure({
                    error,
                    notifications: action.notifications,
                  })
                );
              })
            )
        )
      )
  );

  markNotificationAsUnread$ = createEffect(
    (): Observable<Action> =>
      this.actions$.pipe(
        ofType(NotificationActions.notificationsMarkedAsUnread),
        tap(() => console.log('In Effect: Marking notification as unread')),
        mergeMap((action) =>
          this.notificationService
            .markNotificationAsUnread(action.notifications)
            .pipe(
              map((successMsg: { message: string }) =>
                NotificationActions.notificationsMarkedAsUnreadSuccess()
              ),
              catchError((error) => {
                console.log(error);
                return of(
                  NotificationActions.notificationsMarkedAsUnreadFailure({
                    error,
                    notifications: action.notifications,
                  })
                );
              })
            )
        )
      )
  );

  starNotification$ = createEffect(
    (): Observable<Action> =>
      this.actions$.pipe(
        ofType(NotificationActions.starNotifications),
        tap(() => console.log('In Effect: Starring notification')),
        mergeMap((action) =>
          this.notificationService.starNotification(action.notifications).pipe(
            map((successMsg: { message: string }) =>
              NotificationActions.starNotificationsSuccess()
            ),
            catchError((error) => {
              console.log(error);
              return of(
                NotificationActions.starNotificationsFailure({
                  error,
                  notifications: action.notifications,
                })
              );
            })
          )
        )
      )
  );

  unstarNotification$ = createEffect(
    (): Observable<Action> =>
      this.actions$.pipe(
        ofType(NotificationActions.unstarNotifications),
        tap(() => console.log('In Effect: Unstarring notification')),
        mergeMap((action) =>
          this.notificationService
            .unstarNotification(action.notifications)
            .pipe(
              map((successMsg: { message: string }) =>
                NotificationActions.unstarNotificationsSuccess()
              ),
              catchError((error) => {
                console.log(error);
                return of(
                  NotificationActions.unstarNotificationsFailure({
                    error,
                    notifications: action.notifications,
                  })
                );
              })
            )
        )
      )
  );
}
