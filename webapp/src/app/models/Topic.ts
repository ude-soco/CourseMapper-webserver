import { Channel } from "./Channel";

export interface Topic{
    _id: string,
    name: string,
    course_id: string,
    channels: Channel[],
    notification?: number
}