export interface Channel {
  _id: string;
  name: string;
  description?: string;
  topicId: string;
  courseId: string;
  notification?: number;
}
