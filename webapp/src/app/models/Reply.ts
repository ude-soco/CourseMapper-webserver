export interface Reply {
  _id?: string;
  content: string;
  author?: {
    userId: string;
    name: string;
    role?: string;
  };
  courseId?: string;
  topicId?: string;
  channelId?: string;
  materialId?: string;
  annotationId?: string;
  likes?: string[];
  dislikes?: string[];
  createdAt?: number;
  updatedAt?: number;
}
