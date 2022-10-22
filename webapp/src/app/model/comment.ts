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
