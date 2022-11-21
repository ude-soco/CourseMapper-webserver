export type MaterialType = "pdf" | "video";


export interface Material {
  _id: string;
  name: string;
  type: MaterialType;
  url: string;
  description?:string
}
export interface CreateMaterial {
  
  name: string;
  type: MaterialType;
  courseID:string;
  topicID:string;
  url:string;
  userID:string;
  channelID:string;
  description:string
}