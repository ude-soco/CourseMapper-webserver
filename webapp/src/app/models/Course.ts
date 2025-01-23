import { Channel } from './Channel';
import { Topic } from './Topic';
import { User } from './User';

export interface Course {
  _id: string;
  name: string;
  shortName?: string;
  url?: string;
  description?: string;
  role?: string;
  numberTopics?: number;
  notification?: number;
  numberChannels?: number;
  numberUsers?: number;
  channels?: Channel;
  createdAt?: string;
  users?: User;
  isBlocked?: boolean;
  creator?: string;
  topics?: Topic[];
  menuItems?: [];
  non_editing_teacher_permissions?: {};
  co_teacher_permissions?: {};
 
}
