import { Channel } from './Channel';
import { Topic } from './Topic';
export class TopicImp implements Topic{
    _id: string;
    name: string;
    course_id: string;
    channels: Channel[];
    notification?: number;


    constructor(name:string, _id: string, course_id: string, channels?: Channel[], notification?: number) {
        this.setName(name);
        this.set_id(_id);
        this.setNotification(notification);
        this.setChannels(channels);
        this.setCourse_id(course_id);
    }

    set_id(_id: string){
        this._id = _id;
    }
    get_id(): string{
        return this._id;
    }

    setCourse_id(_id: string){
        this.course_id = _id;
    }
    getCourse_id(): string{
        return this.course_id;
    }

    setChannels(channels: Channel[]){
        this.channels = channels;
    }
    getChannels(): Channel[] {
        return this.channels;
    }

    setName(name: string){
        this.name = name;
    }
    getName(): string{
        return this.name;
    }

    setNotification(notification: number){
        notification? this.notification = notification : this.notification = 0;
    }
    getNotification(): number{
        return this.notification;
    }
}