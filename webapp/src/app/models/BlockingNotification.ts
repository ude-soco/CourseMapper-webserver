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
  isCourseLevelOverride: boolean;
  /* showCourseActivityIndicator?: boolean; */
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
  /*  showTopicActivityIndicator?: true; */
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
  /*  showChannelActivityIndicator?: boolean; */
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
  /* showMaterialActivityIndicator: boolean; */
}

export interface GlobalAndCourseNotificationSettings {
  coursesSettings: CourseNotificationSettings[];
  isAnnotationNotificationsEnabled: boolean;
  isReplyAndMentionedNotificationsEnabled: boolean;
  isCourseUpdateNotificationsEnabled: boolean;
}

export interface CourseNotificationSettings {
  courseId: string;
  isAnnotationNotificationsEnabled: boolean;
  isReplyAndMentionedNotificationsEnabled: boolean;
  isCourseUpdateNotificationsEnabled: boolean;
  isCourseLevelOverride: boolean;
  courseName: string;
  /*   showCourseActivityIndicator: boolean; */
  _id: string;
}

export interface Annotation {
  annotationId: string;
  materialId: string;
  materialType: string;
  content: string;
  topicId: string;
  channelId: string;
  courseId: string;
  userId: string;
  isFollowing: boolean;
  _id: string;
}
