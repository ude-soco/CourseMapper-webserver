export interface Course {
  _id?: string;
  course?: string;
  shortName?: string;
  description?: string;
  userID?: string;
  createdAt?: number;
  updatedAt?: number;
  lessons?: Lesson[];
}
export interface CreateCourse {
  course: string;
  shortName: string;
  description: string;
  userID: string;
  createdAt: number;
  updatedAt: number;
  lessons: Lesson[];
}
export interface Lesson {
  _id: string;
  courseID: string;
  topic: string;
  userID: string;
  channels: Channel[];
}
export interface CreateLesson {
  courseID: string;
  topic: string;
  userID: string;
  channels: Channel[];
}
export interface Channel {
  _id: string;
  name: string;
  description: string;
  materials: Material[];
}
export interface CreateChannel {
  createdAt: number;
  updatedAt: number;
  name: string;
  description: string;
  materials: Material[];
  courseID: string;
  topicID: string;
}

export type MaterialType = 'lecture' | 'handson' | 'video' | 'draft';

export interface Material {
  _id: string;
  name: string;
  type: MaterialType;
  url: string;
}
export interface CreateMaterial {
  name: string;
  type: MaterialType;
  courseID: string;
  topicID: string;
  url: string;
  userID: string;
  channelID: string;
  description: string;
}
