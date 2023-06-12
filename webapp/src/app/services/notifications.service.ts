import { Injectable } from '@angular/core';
import * as NotificationActions from '../pages/components/notifications/state/notifications.actions';
import { BehaviorSubject, Observable, map, tap } from 'rxjs';
import {
  UserNotification,
  Notification,
  LiveNotification,
} from '../models/Notification';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { SocketIoModule, SocketIoConfig, Socket } from 'ngx-socket-io';
import { UserServiceService } from './user-service.service';
import { StorageService } from './storage.service';
import { State } from '../pages/components/notifications/state/notifications.reducer';
import { Store } from '@ngrx/store';
@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  constructor(
    private httpClient: HttpClient,
    private storageService: StorageService,
    private socket: Socket,
    private store: Store<State>
  ) {}

  //Todo: error handling
  public getAllNotifications(): Observable<Notification[]> {
    console.log('In Service: Fetching notifications');
    return this.httpClient
      .get<UserNotification[]>(`${environment.API_URL}/notifications`)
      .pipe(
        tap((notifications) => console.log(notifications)),
        map((notifications) => {
          return notifications.map(this.transformNotification);
        }),
        tap((notifications) => console.log(notifications))
      );
  }

  private transformNotification(notification: UserNotification): Notification {
    const lastWord =
      notification.activityId.statement.object.definition.type.slice(40);

    return {
      userShortname: notification.activityId.notificationInfo.userShortname,
      courseName: notification.activityId.notificationInfo.courseName,
      username: notification.activityId.notificationInfo.userName,
      action: notification.activityId.statement.verb.display['en-US'],
      name: notification.activityId.statement.object.definition.name['en-US'],
      object: lastWord,
      category: notification.activityId.notificationInfo.category,
      isStar: notification.isStar,
      isRead: notification.isRead,
      timestamp: notification.activityId.statement.timestamp,
    };
  }

  public initialiseSocketConnection() {
    console.log('initialising socket connection');
    const user = this.storageService.getUser();
    console.log(user);
    this.socket.on(user.id, (data: UserNotification[]) => {
      console.log('received notification');
      console.log(data);
      const notification = data.map(this.transformNotification);
      console.log('mapped notifications');
      console.log(notification);
      notification.forEach((notification) => {
        console.log('dispatching notification');

        this.store.dispatch(
          NotificationActions.newNotificationArrived({ notification })
        );
      });

      //TODO: Dispatch an action to add the notifications to the store.
    });
  }
}

/*   private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  private notificationsList$ = this.notificationsSubject.asObservable();

  private liveNotificationsSubject = new BehaviorSubject<LiveNotification[]>(
    []
  );
  private liveNotificationsList$ = this.liveNotificationsSubject.asObservable();
  private mappedliveNotificationsList$: Observable<Notification[]> =
    this.liveNotificationsList$.pipe(
      map((notifications) =>
        notifications.map((notification) => {
          const extensions =
            notification.statement.object.definition.extensions;
          const urlExtension = Object.keys(extensions)[0];
          const lastPart = urlExtension.substring(
            urlExtension.lastIndexOf('/') + 1
          );
          const words = lastPart.split('.');
          const lastWord = words[words.length - 1];
          return {
            userShortname: notification.notificationInfo.userShortname,
            courseName: notification.notificationInfo.courseName,
            username: notification.notificationInfo.userName,
            action: notification.statement.verb.display['en-US'],
            name: notification.statement.object.definition.name['en-US'],
            object: lastWord,
          };
        })
      )
    );

  public $notifications = combineLatest([
    this.notificationsList$,
    this.mappedliveNotificationsList$,
  ]).pipe(
    map(([notifications, liveNotifications]) => {
      return [...notifications, ...liveNotifications];
    })
  ); */

//fetch the data when the bell component is initialized but do not subscribe to it
//TODO: add error handling
/*   public fetchNotifications() {
    this.httpClient
      .get<UserNotification[]>(`${environment.API_URL}/notifications`)
      .pipe(
        tap((notifications) => console.log(notifications)),
        map((notifications) => {
          return notifications.map((notification) => {
            const extensions =
              notification.activityId.statement.object.definition.extensions;
            const urlExtension = Object.keys(extensions)[0];
            const lastPart = urlExtension.substring(
              urlExtension.lastIndexOf('/') + 1
            );
            const words = lastPart.split('.');
            const lastWord = words[words.length - 1];
            return {
              userShortname:
                notification.activityId.notificationInfo.userShortname,
              courseName: notification.activityId.notificationInfo.courseName,
              username: notification.activityId.notificationInfo.userName,
              action: notification.activityId.statement.verb.display['en-US'],
              name: notification.activityId.statement.object.definition.name[
                'en-US'
              ],
              object: lastWord,
            };
          });
        }),
        tap((notifications) => console.log(notifications))
      )
      .subscribe((notifications) => {
        this.notificationsSubject.next(notifications);
      });
  } */

/*    */
