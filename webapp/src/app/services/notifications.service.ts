import { Injectable } from '@angular/core';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  last,
  map,
  tap,
} from 'rxjs';
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
@Injectable({
  providedIn: 'root',
})
export class NotificationsService {
  constructor(
    private httpClient: HttpClient,
    private storageService: StorageService,
    private socket: Socket
  ) {}

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

  /*   public initialiseSocketConnection() {
    console.log('initialising socket connection');
    const user = this.storageService.getUser();
    console.log(user);
    this.socket.on(user.id, (data: any) => {
      console.log('received notification');
      console.log(data);
      this.liveNotificationsSubject.next(data);
    });
  } */
}
