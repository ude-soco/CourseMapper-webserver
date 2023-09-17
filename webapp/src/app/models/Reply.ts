export interface Reply {
  _id?: string;
  content: string;
  author?: {
    userId: string;
    name: string;
    username?: string;
    email?: string;
    role?: {
      _id?: string;
      name?: string;
    };
  };
  mentionedUsers?: {
    userId: string;
    name: string;
    email: string;
  }[];
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
