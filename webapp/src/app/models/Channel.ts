import { Material } from './Material';

export interface Channel {
  _id: string;
  name: string;
  description?: string;
  topicId: string;
  courseId: string;
  notification?: number;
  materials?: Material[];
  isAnnotationNotificationsEnabled?: boolean;
  isReplyAndMentionedNotificationsEnabled?: boolean;
  isCourseUpdateNotificationsEnabled?: boolean;
  isTopicLevelOverride?: boolean;
  isChannelLevelOverride?: boolean;
}
