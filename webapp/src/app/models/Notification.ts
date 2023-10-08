import { BlockingNotifications } from './BlockingNotification';

export interface UserNotification {
  //the below 2 attrbiutes are only present when we are deleting a course.
  courseId?: string;
  isDeletingCourse?: boolean;
  _id: string;
  activityId: {
    notificationInfo: {
      category: any;
      userShortname: string;
      courseName: string;
      topicName: string;
      channelName: string;
      userName: string;
      materialType?: string;
      authorEmail: string;
      annotation_id?: string;
      annotationAuthorId?: string;
      replyAuthorId?: string;
      isFollowingAnnotation?: boolean;
      isDeletingAnnotation?: boolean;
      isDeletingReply?: boolean;
      isDeletingMaterial?: boolean;
      isDeletingTopic?: boolean;
      isDeletingChannel?: boolean;
      isDeletingCourse?: boolean;
    };
    statement: {
      actor: {
        name: string;
      };
      object: {
        id: string;
        definition: {
          name: {
            'en-US': string;
          };
          extensions: {
            [key: string]: {
              id: string;
              course_id: string;
              topic_id?: string;
              channel_id?: string;
              material_id?: string;
              description: string;
            };
          };
          type: string;
        };
      };
      verb: {
        display: {
          'en-US': string;
        };
      };
      result?: {
        extensions: {
          [key: string]: {
            id: string; // Assuming _id is of string type
            content: string; // Assuming content is of string type
          };
        };
      };
      timestamp: string;
    };
  };
  isStar: boolean;
  isRead: boolean;
}

export interface Notification {
  _id: string;
  userShortname: string;
  courseName: string;
  username: string;
  authorId: string;
  authorEmail: string;
  action: string;
  name: string;
  object: string;
  category: string;
  isStar: boolean;
  isRead: boolean;
  timestamp: string;
  course_id: string;
  topic_id?: string;
  channel_id?: string;
  material_id?: string;
  annotation_id?: string;
  reply_id?: string;
  materialType?: string;
  extraMessage?: string;
  replyAuthorId?: string;
  annotationAuthorId?: string;
  isFollowingAnnotation?: boolean;
  isDeletingAnnotation?: boolean;
  isDeletingReply?: boolean;
  isDeletingMaterial?: boolean;
  isDeletingTopic?: boolean;
  isDeletingChannel?: boolean;
}

export interface BlockingUsers {
  _id: string;
  firstname: string;
  lastname: string;
  email: string;
}

export interface NotificationsWithBlockedUsers {
  notifications: UserNotification[];
  blockingUsers: BlockingUsers[];
}

export interface TransformedNotificationsWithBlockedUsers {
  notifications: Notification[];
  blockingUsers: BlockingUsers[];
}

/* export interface UserNotificationWithIndicators {
  activityIndicator: BlockingNotifications;
  userNotification: UserNotification[];
} */

export enum NotificationCategory {
  CourseUpdate = 'courseupdates',
  CommentsAndMentioned = 'mentionedandreplied',
  Annotations = 'annotations',
  All = 'All',
  undefined = 'undefined',
}

export enum topicNotificationSettingLabels {
  courseDefault = 'Course default',
  topicUpdates = 'Topic Updates',
  commentsAndMentioned = 'Replies & Mentions',
  annotations = 'Annotations',
}

export enum channelNotificationSettingLabels {
  topicDefault = 'Topic default',
  channelUpdates = 'Channel Updates',
  commentsAndMentioned = 'Replies & Mentions',
  annotations = 'Annotations',
}

export enum materialNotificationSettingLabels {
  channelDefault = 'Channel default',
  materialUpdates = 'Material Updates',
  commentsAndMentioned = 'Replies & Mentions',
  annotations = 'Annotations',
}
export enum courseNotificationSettingLabels {
  globalDefault = 'Global default',
  courseUpdates = 'Course Updates',
  commentsAndMentioned = 'Replies & Mentions',
  annotations = 'Annotations',
}

export enum globalNotificationSettingsLabels {
  courseUpdates = 'Course Updates',
  commentsAndMentioned = 'Replies & Mentions',
  annotations = 'Annotations',
}
