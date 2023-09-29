import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { catchError, map, of, tap } from 'rxjs';
import { Observable, mergeMap } from 'rxjs';
import { NotificationsService } from 'src/app/services/notifications.service';
import * as NotificationActions from './notifications.actions';
import { Action } from '@ngrx/store';
import { BlockingNotifications } from 'src/app/models/BlockingNotification';
import { TransformedNotificationsWithBlockedUsers } from 'src/app/models/Notification';
import * as AppActions from 'src/app/state/app.actions';
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

        mergeMap(() =>
          this.notificationService.getAllNotifications().pipe(
            map((transformedNotificationsWithBlockedUsers) =>
              NotificationActions.loadNotificationsSuccess({
                transformedNotificationsWithBlockedUsers,
              })
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

  removeNotification$ = createEffect(
    (): Observable<Action> =>
      this.actions$.pipe(
        ofType(NotificationActions.notificationsRemoved),
        tap(() => console.log('In Effect: Removing notification')),
        mergeMap((action) =>
          this.notificationService
            .removeNotification(
              action.notifications.map((notification) => notification._id)
            )
            .pipe(
              map((successMsg: { message: string }) =>
                NotificationActions.notificationsRemovedSuccess()
              ),
              catchError((error) => {
                console.log(error);
                return of(
                  NotificationActions.notificationsRemovedFailure({
                    error,
                    notifications: action.notifications,
                  })
                );
              })
            )
        )
      )
  );

  blockUser$ = createEffect(
    (): Observable<Action> =>
      this.actions$.pipe(
        ofType(NotificationActions.blockUser),
        tap(() => console.log('In Effect: Blocking user')),
        mergeMap((action) =>
          this.notificationService.blockUser(action.userId).pipe(
            mergeMap((blockingUsers) => [
              NotificationActions.blockUserSuccess({ blockingUsers }),
              AppActions.setShowPopupMessage({
                showPopupMessage: true,
                popupMessage: 'You have successfully blocked the user!',
              }),
            ]),
            catchError((error) => {
              console.log(error);
              return of(
                NotificationActions.blockUserFailure({
                  error,
                })
              );
            })
          )
        )
      )
  );

  unblockUser$ = createEffect(
    (): Observable<Action> =>
      this.actions$.pipe(
        ofType(NotificationActions.unblockUser),
        tap(() => console.log('In Effect: Unblocking user')),
        mergeMap((action) =>
          this.notificationService.unblockUser(action.userId).pipe(
            mergeMap((blockingUsers) => [
              NotificationActions.unblockUserSuccess({ blockingUsers }),
              AppActions.setShowPopupMessage({
                showPopupMessage: true,
                popupMessage: 'You have successfully unblocked the user!',
              }),
            ]),
            catchError((error) => {
              console.log(error);
              return of(
                NotificationActions.unblockUserFailure({
                  error,
                })
              );
            })
          )
        )
      )
  );

  loadGlobalAndCoursesNotificationSettings$ = createEffect(
    (): Observable<Action> =>
      this.actions$.pipe(
        ofType(NotificationActions.loadGlobalAndCoursesNotificationSettings),
        tap(() =>
          console.log('In Effect: Fetching global and courses notification')
        ),
        mergeMap(() =>
          this.notificationService
            .getCourseNotificationSettings()
            .pipe(
              map((notificationSettings) =>
                NotificationActions.loadGlobalAndCoursesNotificationSettingsSuccess(
                  notificationSettings
                )
              )
            )
        )
      )
  );

  setGlobalNotificationSettings$ = createEffect(
    (): Observable<Action> =>
      this.actions$.pipe(
        ofType(NotificationActions.setGlobalNotificationSettings),
        tap(() => console.log('In Effect: Setting global notification')),
        mergeMap((action) =>
          this.notificationService
            .setGlobalNotificationSettings(action)
            .pipe(
              map((notificationSettings) =>
                NotificationActions.setGlobalNotificationSettingsSuccess(
                  notificationSettings
                )
              )
            )
        )
      )
  );
}
