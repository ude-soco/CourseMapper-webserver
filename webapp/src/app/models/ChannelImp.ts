import { Channel } from "./Channel";

export class ChannelImp implements Channel{
    _id: string;
    name: string;
    description?: string;
    topic_id: string;
    course_id: string;
    notification?: number;

    constructor(name:string, _id: string, topic_id: string, course_id: string, description?: string, notification?: number) {
        this.setName(name);
        this.set_id(_id);
        this.setNotification(notification);
        this.setCourse_id(course_id);
        this.setDescription(description);
        this.setTopic_id(topic_id);
    }

    set_id(_id: string){
        this._id = _id;
    }
    get_id(): string{
        return this._id;
    }

    setDescription(description : string){
        description? this.description = description : this.description ='';
    }
    getDescription(): string{
        return this.description;
    }

    setCourse_id(_id: string){
        this.course_id = _id;
    }
    getCourse_id(): string{
        return this.course_id;
    }

    setTopic_id(_id: string){
        this.topic_id = _id;
    }
    getTopic_id(): string{
        return this.topic_id;
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