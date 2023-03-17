import { Channel } from './Channel';

export class ChannelImp implements Channel {
  _id: string;
  name: string;
  description?: string;
  topicId: string;
  courseId: string;
  notification?: number;

  constructor(
    name: string,
    _id: string,
    topicId: string,
    courseId: string,
    description?: string,
    notification?: number
  ) {
    this.setName(name);
    this.set_id(_id);
    this.setNotification(notification);
    this.setCourseId(courseId);
    this.setDescription(description);
    this.setTopicId(topicId);
  }

  set_id(_id: string) {
    this._id = _id;
  }

  get_id(): string {
    return this._id;
  }

  setDescription(description: string) {
    description ? (this.description = description) : (this.description = '');
  }

  getDescription(): string {
    return this.description;
  }

  setCourseId(_id: string) {
    this.courseId = _id;
  }

  getCourseId(): string {
    return this.courseId;
  }

  setTopicId(_id: string) {
    this.topicId = _id;
  }

  getTopicId(): string {
    return this.topicId;
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
