export interface NotificationItem {
  id: string;
  userName: string;
  shortName: string;
  message: NotificationMessage;
  time: string;
  read: boolean;
  isStar: boolean;
}

export interface NotificationMessage {
  messageType: string;
  action: string;
  courseName: string;
  topicName: string;
  channelName: string;
  message?: string;
}

export enum NotificationType {
  CourseUpdate = 'courseupdate',
  CommentsAndMentioned = 'commentsandmentioned',
  Annotations = 'annotations',
}

export interface NotificationTypeFilter {
  name: string;
  type: NotificationType;
}
