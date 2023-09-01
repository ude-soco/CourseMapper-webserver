import { createAction, props } from '@ngrx/store';
import { BlockableUI } from 'primeng/api';
import {
  BlockingNotifications,
  GlobalAndCourseNotificationSettings,
} from 'src/app/models/BlockingNotification';
import {
  BlockingUsers,
  Notification,
  NotificationCategory,
  TransformedNotificationsWithBlockedUsers,
} from 'src/app/models/Notification';

export const loadNotifications = createAction(
  '[Notification] Load Notifications'
);

export const loadNotificationsSuccess = createAction(
  '[Notification] Notifications Loaded Success',
  props<{
    transformedNotificationsWithBlockedUsers: TransformedNotificationsWithBlockedUsers;
  }>()
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

export const blockUser = createAction(
  '[Notification] User Blocked',
  props<{ userId: string }>()
);

export const blockUserSuccess = createAction(
  '[Notification] User Blocked Success',
  props<{ blockingUsers: BlockingUsers[] }>()
);

export const blockUserFailure = createAction(
  '[Notification] User Blocked Failure',
  props<{ error: any }>()
);

export const unblockUser = createAction(
  '[Notification] User Unblocked',
  props<{ userId: string }>()
);

export const unblockUserSuccess = createAction(
  '[Notification] User Unblocked Success',
  props<{ blockingUsers: BlockingUsers[] }>()
);

export const unblockUserFailure = createAction(
  '[Notification] User Unblocked Failure',
  props<{ error: any }>()
);

export const setSearchTerm = createAction(
  '[Notification] Set Search Term',
  props<{ searchTerm: string }>()
);

export const loadGlobalAndCoursesNotificationSettings = createAction(
  '[Notification] Load Global And Courses Notification Settings'
);

export const loadGlobalAndCoursesNotificationSettingsSuccess = createAction(
  '[Notification] Load Global And Courses Notification Settings Success',
  props<GlobalAndCourseNotificationSettings>()
);

export const loadGlobalAndCoursesNotificationSettingsFailure = createAction(
  '[Notification] Load Global And Courses Notification Settings Failure',
  props<{ error: any }>()
);

export const setGlobalNotificationSettings = createAction(
  '[Notification] Set Global Notification Settings',
  props<{ [key: string]: boolean | string }>()
);

export const setGlobalNotificationSettingsSuccess = createAction(
  '[Notification] Set Global Notification Settings Success',
  props<{ [key: string]: boolean }>()
);

export const setGlobalNotificationSettingsFailure = createAction(
  '[Notification] Set Global Notification Settings Failure',
  props<{ error: any }>()
);

export const setCourseNotificationSettingsSuccess = createAction(
  '[Notification] Set Course Notification Settings Success2',
  props<{
    updatedDoc: BlockingNotifications;
  }>()
);

export const unsetCourseNotificationSettingsSuccess = createAction(
  '[Notification] Unset Course Notification Settings Success2',
  props<{
    updatedDoc: BlockingNotifications;
  }>()
);
