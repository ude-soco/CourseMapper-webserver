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
