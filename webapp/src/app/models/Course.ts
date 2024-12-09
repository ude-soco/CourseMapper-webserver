import { Channel } from "./Channel";
import { Topic } from "./Topic";
import { User } from "./User";

export interface Course {
  _id: string;
  name: string;
  shortName?: string;
  description?: string;
  role?: string;
  numberTopics?: number;
  notification?: number;
  numberChannels?: number;
  numberUsers?: number;
  channels?:Channel;
  createdAt?:string;
  users?:User;
  topics?:Topic[];
  
}
