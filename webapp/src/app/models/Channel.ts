export interface Channel{
    _id: string,
    name: string,
    description?:string,
    topic_id: string,
    course_id: string,
    notification?: number
}