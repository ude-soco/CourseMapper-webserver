import { Channel } from './Channel';

export interface Topic {
  _id: string;
  name: string;
  courseId?: string;
  channels: Channel[];
  notification?: number;
  /*   isAnnotationNotificationsEnabled?: boolean;
  isReplyAndMentionedNotificationsEnabled?: boolean;
  isCourseUpdateNotificationsEnabled?: boolean;
  isTopicLevelOverride?: boolean; */
}
