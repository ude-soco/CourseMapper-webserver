export interface BlockingNotifications {
  _id: string;
  courseId: string;
  isAnnotationNotificationsEnabled: boolean;
  isReplyAndMentionedNotificationsEnabled: boolean;
  isCourseUpdateNotificationsEnabled: boolean;
  userId: string;
  topics: TopicNotificationSettings[];
  channels: ChannelNotificationSettings[];
  materials: MaterialNotificationSettings[];
}

export interface TopicNotificationSettings {
  topicId: string;
  isAnnotationNotificationsEnabled: boolean;
  isReplyAndMentionedNotificationsEnabled: boolean;
  isCourseUpdateNotificationsEnabled: boolean;
  isTopicLevelOverride: boolean;
  _id: string;
  name: string;
  type?: string;
}

export interface ChannelNotificationSettings {
  topicId: string;
  channelId: string;
  followingAnnotations: Annotation[];
  isAnnotationNotificationsEnabled: boolean;
  isReplyAndMentionedNotificationsEnabled: boolean;
  isCourseUpdateNotificationsEnabled: boolean;
  isChannelLevelOverride: boolean;
  isTopicLevelOverride: boolean;
  _id: string;
  name: string;
  type?: string;
}

export interface MaterialNotificationSettings {
  materialId: string;
  topicId: string;
  channelId: string;
  name: string;
  isAnnotationNotificationsEnabled: boolean;
  isReplyAndMentionedNotificationsEnabled: boolean;
  isCourseUpdateNotificationsEnabled: boolean;
  isMaterialLevelOverride: boolean;
  isChannelLevelOverride: boolean;
  isTopicLevelOverride: boolean;
  _id: string;
  type?: string;
}

export interface CourseNotificationSettings {
  courseId: string;
  isAnnotationNotificationsEnabled: boolean;
  isReplyAndMentionedNotificationsEnabled: boolean;
  isCourseUpdateNotificationsEnabled: boolean;
  isCourseLevelOverride: boolean;
  courseName: string;
  _id: string;
}

export interface GlobalAndCourseNotificationSettings {
  coursesSettings: CourseNotificationSettings[];
  isAnnotationNotificationsEnabled: boolean;
  isReplyAndMentionedNotificationsEnabled: boolean;
  isCourseUpdateNotificationsEnabled: boolean;
}

export interface Annotation {
  annotationId: string;
  materialId: string;
  materialType: string;
  annotationContent: string;
  topicId: string;
  channelId: string;
  courseId: string;

  userId: string;
  isFollowing: boolean;
  _id: string;
}
