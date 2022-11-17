export enum NotificationType {
  CourseUpdate = 'courseupdates',
  CommentsAndMentioned = 'mentionedandreplied',
  Annotations = 'annotations',
  undefined = 'undefined',
}

export interface NotificationTypeFilter {
  name: string;
  type: NotificationType;
}
export interface NotificationNumberFilter {
  value: number | string;
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
  channelId: string;
  annotationId: string;
  materialId: string;
  extraMessage: string;
  replyBelongsTo: string;
  isStar: boolean;
  name: string;
  read: boolean;
  type: string;
  userId: string;
  userName: string;
  userShortname: string;
  createdAt: string;
}

export interface ActiveLocation {
  courseId: string;
  topic?: string;
  channelId: string;
}
