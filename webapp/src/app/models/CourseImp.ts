import { Course } from './Course';
import { User } from './User';

export class CourseImp implements Course {
  _id: string;
  name: string;
  role: string;
  shortName?: string;
  description?: string;
  numberTopics?: number;
  notification?: number;
  numberChannels?: number;
  numberUsers?: number;
  createdAt?:string;
  users?:User;
  non_editing_teacher_permissions?: Object;
  co_teacher_permissions?: Object;


  constructor(
    _id: string,
    name: string,
    shortName?: string,
    description?: string,
    role?: string,
    numberTopics?: number,
    notification?: number,
    numberChannels?: number,
    numberUsers?: number,
    createdAt?: string,
    users?: User,
    non_editing_teacher_permissions?: Object,
    co_teacher_permissions?: Object,


  ) {
    this.set_id(_id);
    this.setName(name);
    this.setRole(role);
    this.setShortName(shortName);
    this.setDescription(description);
    this.setNumberTopics(numberTopics);
    this.setNotification(notification);
    this.setNumberChannels(numberChannels);
    this.setNumberUsers(numberUsers);
    this.setcreatedAt(createdAt);
    this.setUsers(users);

  }
  setcreatedAt(createdAtd: string) {
    this.createdAt = createdAtd;
  }

  getcreatedAt(): string {
    return this.createdAt;
  }

  setUsers(users: User) {
    this.users = users;
  }

  getUsers(): User {
    return this.users;
  }

  set_id(_id: string) {
    this._id = _id;
  }

  get_id(): string {
    return this._id;
  }

  setRole(role: string) {
    role ? (this.role = role) : (this.role = '');
  }

  getRole(): string {
    return this.role;
  }

  setName(name) {
    this.name = name;
  }

  getName(): string {
    return this.name;
  }

  setShortName(shortName) {
    shortName ? (this.shortName = shortName) : (this.shortName = '');
  }

  getShortName(): string {
    return this.shortName;
  }

  setDescription(description) {
    description ? (this.description = description) : (this.description = '');
  }

  getDescription(): string {
    return this.description;
  }

  setNumberTopics(numberTopics) {
    numberTopics ? (this.numberTopics = numberTopics) : (this.numberTopics = 0);
  }

  getNumberTopics(): number {
    return this.numberTopics;
  }

  setNotification(notification) {
    notification ? (this.notification = notification) : (this.notification = 0);
  }

  getNotification(): number {
    return this.notification;
  }

  setNumberChannels(numberChannels) {
    numberChannels
      ? (this.numberChannels = numberChannels)
      : (this.numberChannels = 0);
  }

  getNumberChannels(): number {
    return this.numberChannels;
  }

  setNumberUsers(numberUsers) {
    numberUsers ? (this.numberUsers = numberUsers) : (this.numberUsers = 0);
  }

  getNumberUsers(): number {
    return this.numberUsers;
  }
}
