export interface UserNotification {
  activityId: {
    notificationInfo: {
      category: any;
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
  };
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
  userShortname: string;
  courseName: string;
  username: string;
  action: string;
  name: string;
  object: string;
  category: string;
}

export enum NotificationCategory {
  CourseUpdate = 'courseupdates',
  CommentsAndMentioned = 'mentionedandreplied',
  Annotations = 'annotations',
  All = 'All',
  undefined = 'undefined',
}
