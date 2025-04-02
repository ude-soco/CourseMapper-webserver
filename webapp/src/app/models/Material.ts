export type MaterialType = 'pdf' | 'video';

export interface Material {
  _id: string;
  name: string;
  type: MaterialType;
  url: string;
  description?:string
  courseId?:string;
  channelId?:string;
  showDialog?:Boolean;
}
export interface CreateMaterial {

  name: string;
  type: MaterialType;
  courseId: string;
  topicId: string;
  url: string;
  //userID:string;
  channelId:string;
  description:string
  videoType?: string; //optional
  showDialog?:Boolean;
}
