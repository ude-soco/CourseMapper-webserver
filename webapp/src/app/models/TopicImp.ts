import { Channel } from './Channel';
import { Topic } from './Topic';

export class TopicImp implements Topic {
  _id: string;
  name: string;
  courseId: string;
  channels: Channel[];
  notification?: number;

  constructor(
    name: string,
    _id: string,
    courseId: string,
    channels?: Channel[],
    notification?: number
  ) {
    this.setName(name);
    this.set_id(_id);
    this.setNotification(notification);
    this.setChannels(channels);
    this.setCourseId(courseId);
  }

  set_id(_id: string) {
    this._id = _id;
  }

  get_id(): string {
    return this._id;
  }

  setCourseId(_id: string) {
    this.courseId = _id;
  }

  getCourseId(): string {
    return this.courseId;
  }

  setChannels(channels: Channel[]) {
    this.channels = channels;
  }

  getChannels(): Channel[] {
    return this.channels;
  }

  setName(name: string) {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  setNotification(notification: number) {
    notification ? (this.notification = notification) : (this.notification = 0);
  }

  getNotification(): number {
    return this.notification;
  }
}
