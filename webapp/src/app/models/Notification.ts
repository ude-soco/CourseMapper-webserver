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
    };
    statement: {
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

export interface LiveNotification {
  notificationInfo: {
    userShortname: string;
    courseName: string;
    topicName: string;
    channelName: string;
    userName: string;
  };
  statement: {
    object: {
      id: string;
      definition: {
        name: {
          'en-US': string;
        };
        extensions: {
          id: string;
          course_id: string;
          topic_id: string;
          description: string;
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
}

export interface Notification {
  _id: string;
  userShortname: string;
  courseName: string;
  username: string;
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
  commentsAndMentioned = 'Comments and mentioned',
  annotations = 'Annotations',
}
