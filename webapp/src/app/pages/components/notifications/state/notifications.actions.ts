import { createAction, props } from '@ngrx/store';
import { BlockableUI } from 'primeng/api';
import { BlockingNotifications } from 'src/app/models/BlockingNotification';
import {
  Notification,
  NotificationCategory,
} from 'src/app/models/Notification';

export const loadNotifications = createAction(
  '[Notification] Load Notifications'
);

export const loadNotificationsSuccess = createAction(
  '[Notification] Notifications Loaded Success',
  props<{ notifications: Notification[] }>()
);

export const tabSwitched = createAction(
  '[Notification] Tab Switched',
  props<{ tab: NotificationCategory }>()
);

export const newNotificationArrived = createAction(
  '[Notification] New Notification Arrived',
  props<{ notification: Notification }>()
);

export const notificationsMarkedAsRead = createAction(
  '[Notification] Notifications Marked As Read',
  props<{ notifications: string[] }>()
);

export const notificationsMarkedAsReadSuccess = createAction(
  '[Notification] Notifications Marked As Read Success'
);

export const notificationsMarkedAsReadFailure = createAction(
  '[Notification] Notifications Marked As Read Failure',
  props<{ error: any; notifications: string[] }>()
);

export const notificationsMarkedAsUnread = createAction(
  '[Notification] Notifications Marked As Unread',
  props<{ notifications: string[] }>()
);

export const notificationsMarkedAsUnreadSuccess = createAction(
  '[Notification] Notifications Marked As Unread Success'
);

export const notificationsMarkedAsUnreadFailure = createAction(
  '[Notification] Notifications Marked As Unread Failure',
  props<{ error: any; notifications: string[] }>()
);

export const notificationsRemoved = createAction(
  '[Notification] Notifications Removed',
  props<{ notifications: Notification[] }>()
);

export const notificationsRemovedSuccess = createAction(
  '[Notification] Notifications Removed Success'
);

export const notificationsRemovedFailure = createAction(
  '[Notification] Notifications Removed Failure',
  props<{ error: any; notifications: Notification[] }>()
);

export const starNotifications = createAction(
  '[Notification] Notifications Starred',
  props<{ notifications: string[] }>()
);

export const starNotificationsSuccess = createAction(
  '[Notification] Notifications Starred Success'
);

export const starNotificationsFailure = createAction(
  '[Notification] Notifications Starred Failure',
  props<{ error: any; notifications: string[] }>()
);

export const unstarNotifications = createAction(
  '[Notification] Notifications Unstarred',
  props<{ notifications: string[] }>()
);

export const unstarNotificationsSuccess = createAction(
  '[Notification] Notifications Unstarred Success'
);

export const unstarNotificationsFailure = createAction(
  '[Notification] Notifications Unstarred Failure',
  props<{ error: any; notifications: string[] }>()
);
