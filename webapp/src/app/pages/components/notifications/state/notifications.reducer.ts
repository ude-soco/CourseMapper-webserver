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

export const getCourseUpdatesNotifications = createSelector(
  getNotifications,
  (notifications) => {
    return notifications
      ? notifications.filter(
          (notification) =>
            notification.category === NotificationCategory.CourseUpdate
        )
      : null;
  }
);

export const getCommentsAndMentionedNotifications = createSelector(
  getNotifications,
  (notifications) => {
    return notifications
      ? notifications.filter(
          (notification) =>
            notification.category === NotificationCategory.CommentsAndMentioned
        )
      : null;
  }
);

export const getAnnotationsNotifications = createSelector(
  getNotifications,
  (notifications) => {
    return notifications
      ? notifications.filter(
          (notification) =>
            notification.category === NotificationCategory.Annotations
        )
      : null;
  }
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
  }),
  on(NotificationActions.notificationsMarkedAsRead, (state, action) => {
    return {
      ...state,
      notifications: state.notifications.map((notification) => {
        if (action.notifications.some((n) => n == notification._id)) {
          return { ...notification, isRead: true };
        }
        return notification;
      }),
    };
  }),
  on(NotificationActions.notificationsMarkedAsReadSuccess, (state, action) => {
    return { ...state };
  }),
  on(
    NotificationActions.notificationsMarkedAsReadFailure,
    (state, { notifications }) => {
      return {
        ...state,
        notifications: state.notifications.map((notification) => {
          if (notifications.some((n) => n == notification._id)) {
            return { ...notification, isRead: false };
          }
          return notification;
        }),
      };
    }
  ),

  on(NotificationActions.notificationsMarkedAsUnread, (state, action) => {
    return {
      ...state,
      notifications: state.notifications.map((notification) => {
        if (action.notifications.some((n) => n == notification._id)) {
          return { ...notification, isRead: false };
        }
        return notification;
      }),
    };
  }),

  on(
    NotificationActions.notificationsMarkedAsUnreadSuccess,
    (state, action) => {
      return { ...state };
    }
  ),

  on(
    NotificationActions.notificationsMarkedAsUnreadFailure,
    (state, action) => {
      return {
        ...state,
        notifications: state.notifications.map((notification) => {
          if (action.notifications.some((n) => n == notification._id)) {
            return { ...notification, isRead: true };
          }
          return notification;
        }),
      };
    }
  ),

  on(NotificationActions.notificationsRemoved, (state, action) => {
    return {
      ...state,
      notifications: state.notifications.filter(
        (notification) =>
          !action.notifications.some((n) => n == notification._id)
      ),
    };
  })
);
