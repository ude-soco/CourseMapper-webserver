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
}

export interface MaterialNotificationSettings {
  materialId: string;
  topicId: string;
  channelId: string;
  isAnnotationNotificationsEnabled: boolean;
  isReplyAndMentionedNotificationsEnabled: boolean;
  isCourseUpdateNotificationsEnabled: boolean;
  isMaterialLevelOverride: boolean;
  isChannelLevelOverride: boolean;
  isTopicLevelOverride: boolean;
  _id: string;
}

interface Annotation {
  annotationId: string;
  materialId: string;
  materialType: string;
  annotationContent: string;
  _id: string;
}