import { createAction, props } from '@ngrx/store';
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
  '[Notification] Notifications Marked As Read Success',
  props<{ notifications: Notification[] }>()
);

export const notificationsMarkedAsReadFailure = createAction(
  '[Notification] Notifications Marked As Read Failure',
  props<{ error: any; notifications: Notification[] }>()
);

/* export const navigateToNotificationContextThroughCourseComponent = createAction(
  '[Notification] Navigate To Notification Context Through Course Component',
  props<{ notification: Notification }>()
);
 */
