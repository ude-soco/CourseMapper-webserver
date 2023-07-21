import { Injectable } from '@angular/core';
import * as NotificationActions from '../pages/components/notifications/state/notifications.actions';
import { BehaviorSubject, Observable, map, switchMap, take, tap } from 'rxjs';
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
import {
  getCurrentCourse,
  getLastTopicMenuClickedId,
} from '../pages/courses/state/course.reducer';
import { BlockingNotifications } from '../models/BlockingNotification';
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

  public previousURL: string = null;
  public notificationToNavigateTo: Notification = null;

  //Todo: error handling
  public getAllNotifications(): Observable<Notification[]> {
    console.log('In Service: Fetching notifications');
    return (
      this.httpClient
        /* .get<UserNotification[]>('assets/data.json') */
        .get<UserNotification[]>(`${environment.API_URL}/notifications`)
        .pipe(
          tap((notifications) => console.log(notifications)),
          map((notifications) => {
            return notifications.map(this.transformNotification);
          }),
          tap((notifications) => console.log(notifications))
        )
    );
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

  markNotificationAsRead(notification: string[]) {
    console.log('In Service: Marking notification as read');
    console.log(notification);
    return this.httpClient.put<{ message: string }>(
      `${environment.API_URL}/notifications/read`,
      { notificationIds: notification }
    );
  }

  markNotificationAsUnread(notification: string[]) {
    console.log('In Service: Marking notification as unread');
    console.log(notification);
    return this.httpClient.put<{ message: string }>(
      `${environment.API_URL}/notifications/unread`,
      { notificationIds: notification }
    );
  }

  starNotification(notification: string[]) {
    console.log('In Service: Starring notification');
    console.log(notification);
    return this.httpClient.put<{ message: string }>(
      `${environment.API_URL}/notifications/star`,
      { notificationIds: notification }
    );
  }

  unstarNotification(notification: string[]) {
    console.log('In Service: Unstarring notification');
    console.log(notification);
    return this.httpClient.put<{ message: string }>(
      `${environment.API_URL}/notifications/unstar`,
      { notificationIds: notification }
    );
  }

  setTopicNotificationSettings(settings: {
    courseId: string;
    Annotations: boolean;
    'Replies & Mentions': boolean;
    'Topic Updates': boolean;
    topicId: string;
  }) {
    let isAnnotationNotificationsEnabled: boolean = settings['Annotations'];
    let isReplyAndMentionedNotificationsEnabled: boolean =
      settings['Replies & Mentions'];
    let isCourseUpdateNotificationsEnabled: boolean = settings['Topic Updates'];
    let courseId = settings['courseId'];
    let topicId = settings['topicId'];

    let objToSend = {
      isAnnotationNotificationsEnabled: isAnnotationNotificationsEnabled,
      isReplyAndMentionedNotificationsEnabled:
        isReplyAndMentionedNotificationsEnabled,
      isCourseUpdateNotificationsEnabled: isCourseUpdateNotificationsEnabled,
      courseId: courseId,
      topicId: topicId,
    };
    console.log(objToSend);
    return this.httpClient.put<BlockingNotifications>(
      `${environment.API_URL}/notifications/setTopicNotificationSettings`,
      objToSend
    );
  }

  //TODO: Fix the URL being used for the below method. Purposely set to false URL to cause error
  removeNotification(notification: string[]) {
    console.log('In Service: Removing notification');
    console.log(notification);
    return this.httpClient.put<{ message: string }>(
      `${environment.API_URL}/notifications/FALSEURL`,
      { notificationIds: notification }
    );
  }

  getUserNames({
    partialString,
    courseId,
  }: {
    partialString: string;
    courseId: string;
  }) {
    return this.httpClient.get<{ name: string; username: string }[]>(
      `${environment.API_URL}/notifications/searchUsers?partialString=${partialString}&courseId=${courseId}`
    );
  }

  private transformNotification(notification: UserNotification): Notification {
    const lastWord =
      notification.activityId.statement.object.definition.type.slice(40);
    const extensions = Object.values(
      notification.activityId.statement.object.definition.extensions
    )[0];
    let channel_id = null;
    let material_id = null;

    if (
      notification.activityId.statement.object.definition.type ===
      'http://www.CourseMapper.de/activityType/channel'
    ) {
      channel_id = extensions.id;
    } else if (extensions.channel_id) {
      channel_id = extensions.channel_id;
    }
    if (
      notification.activityId.statement.object.definition.type ===
      'http://www.CourseMapper.de/activityType/material'
    ) {
      material_id = extensions.id;
    } else if (extensions.material_id) {
      material_id = extensions.material_id;
    }

    return {
      userShortname: notification.activityId.notificationInfo.userShortname,
      courseName: notification.activityId.notificationInfo.courseName,
      username: notification.activityId.notificationInfo.userName,
      action: notification.activityId.statement.verb.display['en-US'],
      name: notification.activityId.statement.object.definition.name['en-US'],
      object: lastWord,
      category: notification.activityId.notificationInfo.category,
      ...(notification.activityId.notificationInfo.materialType && {
        materialType: notification.activityId.notificationInfo.materialType,
      }),
      isStar: notification.isStar,
      isRead: notification.isRead,
      timestamp: notification.activityId.statement.timestamp,
      ...(extensions.course_id && { course_id: extensions.course_id }),
      ...(extensions.topic_id && { topic_id: extensions.topic_id }),
      ...((extensions.channel_id || channel_id) && {
        channel_id,
      }),
      ...((extensions.material_id || material_id) && {
        material_id,
      }),
      _id: notification._id,
    };
  }
}
