import { Injectable } from '@angular/core';
import * as NotificationActions from '../pages/components/notifications/state/notifications.actions';
import { BehaviorSubject, Observable, map, switchMap, take, tap } from 'rxjs';
import {
  UserNotification,
  Notification,
  NotificationsWithBlockedUsers,
  TransformedNotificationsWithBlockedUsers,
  BlockingUsers,
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
import {
  BlockingNotifications,
  CourseNotificationSettings,
  GlobalAndCourseNotificationSettings,
} from '../models/BlockingNotification';
import {
  topicNotificationSettingLabels,
  channelNotificationSettingLabels,
  materialNotificationSettingLabels,
  courseNotificationSettingLabels,
} from 'src/app/models/Notification';
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
  public getAllNotifications(): Observable<TransformedNotificationsWithBlockedUsers> {
    console.log('In Service: Fetching notifications');
    return (
      this.httpClient
        /* .get<UserNotification[]>('assets/data.json') */
        .get<NotificationsWithBlockedUsers>(
          `${environment.API_URL}/notifications`
        )
        .pipe(
          tap(({ notifications, blockingUsers }) => {
            console.log(notifications);
            console.log(blockingUsers);
          }),
          map(({ notifications, blockingUsers }) => {
            let transformedNotifications = notifications.map(
              this.transformNotification
            );

            return {
              notifications: transformedNotifications,
              blockingUsers,
            };
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

  setGlobalNotificationSettings(settings: { [key: string]: boolean | string }) {
    let isAnnotationNotificationsEnabled: boolean = settings[
      courseNotificationSettingLabels.annotations
    ] as boolean;
    let isReplyAndMentionedNotificationsEnabled: boolean = settings[
      courseNotificationSettingLabels.commentsAndMentioned
    ] as boolean;
    let isCourseUpdateNotificationsEnabled: boolean = settings[
      courseNotificationSettingLabels.courseUpdates
    ] as boolean;

    let objToSend = {
      isAnnotationNotificationsEnabled: isAnnotationNotificationsEnabled,
      isReplyAndMentionedNotificationsEnabled:
        isReplyAndMentionedNotificationsEnabled,
      isCourseUpdateNotificationsEnabled: isCourseUpdateNotificationsEnabled,
    };
    console.log(objToSend);
    return this.httpClient.put<{ [key: string]: boolean }>(
      `${environment.API_URL}/notifications/setGlobalNotificationSettings`,
      objToSend
    );
  }

  setCourseNotificationSettings(settings: {
    courseId: string;
    [key: string]: boolean | string;
  }) {
    let isAnnotationNotificationsEnabled: boolean = settings[
      courseNotificationSettingLabels.annotations
    ] as boolean;
    let isReplyAndMentionedNotificationsEnabled: boolean = settings[
      courseNotificationSettingLabels.commentsAndMentioned
    ] as boolean;
    let isCourseUpdateNotificationsEnabled: boolean = settings[
      courseNotificationSettingLabels.courseUpdates
    ] as boolean;
    let courseId = settings['courseId'];

    let objToSend = {
      isAnnotationNotificationsEnabled: isAnnotationNotificationsEnabled,
      isReplyAndMentionedNotificationsEnabled:
        isReplyAndMentionedNotificationsEnabled,
      isCourseUpdateNotificationsEnabled: isCourseUpdateNotificationsEnabled,
      courseId: courseId,
    };
    console.log(objToSend);
    return this.httpClient.put<BlockingNotifications>(
      `${environment.API_URL}/notifications/setCourseNotificationSettings`,
      objToSend
    );
  }

  unsetCourseNotificationSettings(settings: { courseId: string }) {
    let courseId = settings['courseId'];
    let objToSend = {
      courseId: courseId,
    };
    console.log(objToSend);
    return this.httpClient.put<BlockingNotifications>(
      `${environment.API_URL}/notifications/unsetCourseNotificationSettings`,
      objToSend
    );
  }

  setTopicNotificationSettings(settings: {
    courseId: string;
    topicId: string;
    [key: string]: boolean | string;
  }) {
    let isAnnotationNotificationsEnabled: boolean = settings[
      topicNotificationSettingLabels.annotations
    ] as boolean;
    let isReplyAndMentionedNotificationsEnabled: boolean = settings[
      topicNotificationSettingLabels.commentsAndMentioned
    ] as boolean;
    let isCourseUpdateNotificationsEnabled: boolean = settings[
      topicNotificationSettingLabels.topicUpdates
    ] as boolean;
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

  unsetTopicNotificationSettings(settings: {
    courseId: string;
    topicId: string;
  }) {
    let courseId = settings['courseId'];
    let topicId = settings['topicId'];
    let objToSend = {
      courseId: courseId,
      topicId: topicId,
    };
    console.log(objToSend);
    return this.httpClient.put<BlockingNotifications>(
      `${environment.API_URL}/notifications/unsetTopicNotificationSettings`,
      objToSend
    );
  }

  setChannelNotificationSettings(settings: {
    courseId: string;
    channelId: string;
    [key: string]: boolean | string;
  }) {
    let isAnnotationNotificationsEnabled: boolean = settings[
      channelNotificationSettingLabels.annotations
    ] as boolean;
    let isReplyAndMentionedNotificationsEnabled: boolean = settings[
      channelNotificationSettingLabels.commentsAndMentioned
    ] as boolean;
    let isCourseUpdateNotificationsEnabled: boolean = settings[
      channelNotificationSettingLabels.channelUpdates
    ] as boolean;
    let courseId = settings['courseId'];
    let channelId = settings['channelId'];

    let objToSend = {
      isAnnotationNotificationsEnabled: isAnnotationNotificationsEnabled,
      isReplyAndMentionedNotificationsEnabled:
        isReplyAndMentionedNotificationsEnabled,
      isCourseUpdateNotificationsEnabled: isCourseUpdateNotificationsEnabled,
      courseId: courseId,
      channelId,
    };
    console.log(objToSend);
    return this.httpClient.put<BlockingNotifications>(
      `${environment.API_URL}/notifications/setChannelNotificationSettings`,
      objToSend
    );
  }

  unsetChannelNotificationSettings(settings: {
    courseId: string;
    channelId: string;
  }) {
    let courseId = settings['courseId'];
    let channelId = settings['channelId'];
    let objToSend = {
      courseId: courseId,
      channelId: channelId,
    };
    console.log(objToSend);
    return this.httpClient.put<BlockingNotifications>(
      `${environment.API_URL}/notifications/unsetChannelNotificationSettings`,
      objToSend
    );
  }

  setMaterialNotificationSettings(settings: {
    courseId: string;
    materialId: string;
    [key: string]: boolean | string;
  }) {
    let isAnnotationNotificationsEnabled: boolean = settings[
      materialNotificationSettingLabels.annotations
    ] as boolean;
    let isReplyAndMentionedNotificationsEnabled: boolean = settings[
      materialNotificationSettingLabels.commentsAndMentioned
    ] as boolean;
    let isCourseUpdateNotificationsEnabled: boolean = settings[
      materialNotificationSettingLabels.materialUpdates
    ] as boolean;
    let courseId = settings['courseId'];
    let materialId = settings['materialId'];

    let objToSend = {
      isAnnotationNotificationsEnabled: isAnnotationNotificationsEnabled,
      isReplyAndMentionedNotificationsEnabled:
        isReplyAndMentionedNotificationsEnabled,
      isCourseUpdateNotificationsEnabled: isCourseUpdateNotificationsEnabled,
      courseId: courseId,
      materialId,
    };
    console.log(objToSend);
    return this.httpClient.put<BlockingNotifications>(
      `${environment.API_URL}/notifications/setMaterialNotificationSettings`,
      objToSend
    );
  }

  unsetMaterialNotificationSettings(settings: {
    courseId: string;
    materialId: string;
  }) {
    let courseId = settings['courseId'];
    let materialId = settings['materialId'];
    let objToSend = {
      courseId: courseId,
      materialId: materialId,
    };
    console.log(objToSend);
    return this.httpClient.put<BlockingNotifications>(
      `${environment.API_URL}/notifications/unsetMaterialNotificationSettings`,
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

  followAnnotation(annotationId: string) {
    console.log('In Service: Following annotation');
    console.log(annotationId);
    return this.httpClient.post<BlockingNotifications>(
      `${environment.API_URL}/notifications/followAnnotation/${annotationId}`,
      {}
    );
  }

  getCourseNotificationSettings() {
    return this.httpClient.get<GlobalAndCourseNotificationSettings>(
      `${environment.API_URL}/notifications/getAllCourseNotificationSettings`
    );
  }

  unfollowAnnotation(annotationId: string) {
    console.log('In Service: Unfollowing annotation');
    console.log(annotationId);
    return this.httpClient.post<BlockingNotifications>(
      `${environment.API_URL}/notifications/unfollowAnnotation/${annotationId}`,
      {}
    );
  }

  blockUser(userId: string) {
    console.log('In Service: Blocking user');
    console.log(userId);
    return this.httpClient.put<BlockingUsers[]>(
      `${environment.API_URL}/notifications/blockUser`,
      { userToBlockId: userId }
    );
  }

  unblockUser(userId: string) {
    console.log('In Service: Unblocking user');
    console.log(userId);
    return this.httpClient.put<BlockingUsers[]>(
      `${environment.API_URL}/notifications/unblockUser`,
      { userToUnblockId: userId }
    );
  }

  getUserNames({
    partialString,
    courseId,
  }: {
    partialString: string;
    courseId: string;
  }) {
    return this.httpClient.get<
      { name: string; email: string; userId: string }[]
    >(
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
      authorId: notification.activityId.statement.actor?.name,
      authorEmail: notification.activityId.notificationInfo.authorEmail,
      action: notification.activityId.statement.verb.display['en-US'],
      name: notification.activityId.statement.object.definition.name['en-US'],
      object: lastWord,
      ...(notification.activityId.notificationInfo.annotation_id && {
        annotation_id: notification.activityId.notificationInfo.annotation_id,
      }),
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
      extraMessage: `${notification.activityId.notificationInfo.userName} ${notification.activityId.statement.verb.display['en-US']} ${lastWord} ${notification.activityId.statement.object.definition.name['en-US']} in ${notification.activityId.notificationInfo.courseName}`,
    };
  }
}
