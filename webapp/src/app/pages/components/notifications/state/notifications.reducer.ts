import {
  createFeatureSelector,
  createSelector,
  createReducer,
  on,
} from '@ngrx/store';
import {
  Notification,
  NotificationCategory,
} from 'src/app/models/Notification';

import * as AppState from 'src/app/state/app.state';
import * as NotificationActions from './notifications.actions';
export interface State extends AppState.State {
  notifications: NotificationState;
}

export interface NotificationState {
  notifications: Notification[];
  currentlySelectedTab: NotificationCategory;
  isNavigatingToNotificationContextThroughCourseComponent: boolean;
  notificationToNavigateTo: Notification;
}

const initialState: NotificationState = {
  notifications: undefined,
  currentlySelectedTab: NotificationCategory.All,
  isNavigatingToNotificationContextThroughCourseComponent: false,
  notificationToNavigateTo: null,
};

//selectors
const getNotificationFeatureState =
  createFeatureSelector<NotificationState>('notifications');

export const getNotifications = createSelector(
  getNotificationFeatureState,
  (state) => state.notifications
);

export const getCurrentlySelectedTab = createSelector(
  getNotificationFeatureState,
  (state) => state.currentlySelectedTab
);

export const getFilteredNotifications = createSelector(
  getNotifications,
  getCurrentlySelectedTab,
  (notifications, currentlySelectedTab) => {
    if (notifications) {
      if (currentlySelectedTab === NotificationCategory.All) {
        return notifications;
      } else {
        return notifications.filter(
          (notification) => notification.category === currentlySelectedTab
        );
      }
    }
    return null;
  }
);

export const getAllNotificationsNumUnread = createSelector(
  getNotifications,
  (state) =>
    state
      ? state.filter((notification) => notification.isRead === false).length
      : 0
);

export const getCourseUpdatesNumUnread = createSelector(
  getNotifications,
  (state) =>
    state
      ? state.filter(
          (notification) =>
            notification.isRead === false &&
            notification.category === NotificationCategory.CourseUpdate
        ).length
      : 0
);

export const getCommentsAndMentionedNumUnread = createSelector(
  getNotifications,
  (state) =>
    state
      ? state.filter(
          (notification) =>
            notification.isRead === false &&
            notification.category === NotificationCategory.CommentsAndMentioned
        ).length
      : 0
);

export const getAnnotationsNumUnread = createSelector(
  getNotifications,
  (state) =>
    state
      ? state.filter(
          (notification) =>
            notification.isRead === false &&
            notification.category === NotificationCategory.Annotations
        ).length
      : 0
);

//Reducer
export const notificationReducer = createReducer<NotificationState>(
  initialState,
  on(
    NotificationActions.loadNotificationsSuccess,
    (state, action): NotificationState => {
      //returning the new state
      let sortedNotifications = [...action.notifications];
      sortedNotifications.sort((a, b) => {
        return (
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      });
      return {
        ...state,
        notifications: sortedNotifications,
      };
    }
  ),
  on(NotificationActions.tabSwitched, (state, action): NotificationState => {
    return {
      ...state,
      currentlySelectedTab: action.tab,
    };
  }),
  on(NotificationActions.newNotificationArrived, (state, action) => {
    return {
      ...state,
      notifications: [action.notification, ...state.notifications],
    };
  }) /* ,
  on(
    NotificationActions.navigateToNotificationContextThroughCourseComponent,
    (state, action) => {
      return {
        ...state,
        isNavigatingToNotificationContextThroughCourseComponent: true,
        notificationToNavigateTo: action.notification,
      };
    }
  ) */
);
