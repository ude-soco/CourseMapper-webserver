export interface Comment {
  _id: string;
  annotationID: string;
  author: Author;
  userID: string;
  username: string;
  createdAt: number;
  updatedAt: number;
  content: string;
  likes: string[];
  dislikes: string[];
  isAdmin: boolean;
}

export interface Author {
  _id: string;
  name: string;
}

export interface Annotation {
  author: User;
  channelId: string;
  content: string;
  courseId: string;
  createdAt: number;
  dislikes: string[];
  likes: string[];
  location: Location;
  materialId: string;
  replies: string[];
  tool: Tool;
  topicId: string;
  type: string;
  updatedAt: string;
  _id: string;
  isAdmin: boolean;
  isClosed: boolean;

  closedAt: string;
}

export interface User {
  userId: string;
  name: string;
}

export interface Location {
  lastPage: number;
  startPage: number;
  type: string;
}

export interface Tool {
  color: string;
  coordinates: [];
  id: string;
  page: number;
  rect: string;
  type: string;
}

export interface ActiveAnnotation {
  content: string;
  authorName: string;
  _id: string;
  author: User;
  closedAt: string;
  isClosed: boolean;
  courseId: string;
  materialId: string;
}
