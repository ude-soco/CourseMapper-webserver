export interface UserNotification {
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
  materialType?: string;
  extraMessage?: string;
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

export enum NotificationCategory {
  CourseUpdate = 'courseupdates',
  CommentsAndMentioned = 'mentionedandreplied',
  Annotations = 'annotations',
  All = 'All',
  undefined = 'undefined',
}

export enum topicNotificationSettingLabels {
  courseDefault = 'Course default',
  topicUpdates = 'Topic updates',
  commentsAndMentioned = 'Comments and mentions',
  annotations = 'Annotations',
}

export enum channelNotificationSettingLabels {
  topicDefault = 'Topic default',
  channelUpdates = 'Channel updates',
  commentsAndMentioned = 'Comments and mentions',
  annotations = 'Annotations',
}

export enum materialNotificationSettingLabels {
  channelDefault = 'Channel default',
  materialUpdates = 'Material updates',
  commentsAndMentioned = 'Comments and mentions',
  annotations = 'Annotations',
}
export enum courseNotificationSettingLabels {
  globalDefault = 'Global default',
  courseUpdates = 'Course Updates',
  commentsAndMentioned = 'Comments and mentions',
  annotations = 'Annotations',
}
