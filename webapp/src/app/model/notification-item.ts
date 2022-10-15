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
  CourseUpdate = 'courseupdates',
  CommentsAndMentioned = 'mentionedandreplied',
  Annotations = 'annotations',
}

export interface NotificationTypeFilter {
  name: string;
  type: NotificationType;
}

export interface NotificationData {
  isCourseTurnOff: boolean;
  notificationLists: Notification[];
}

export interface Notification {
  _id: string;
  action: string;
  actionObject: string;
  courseId: string;
  extraMessage: string;
  isStar: boolean;
  name: string;
  read: boolean;
  type: string;
  userId: string;
  userName: string;
  userShortname: string;
  createdAt: string;
}
