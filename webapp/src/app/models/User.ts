import { Course } from "./Course";

export interface User {
    id: string,
    _id: string,
    name: string,
    firstname: string,
    lastname: string,
    photo: string,
    username: string,
    role: string,
    email: string,
    mbox_sha1sum: string,
    courses: Course[],
    jwt: string,
    length: number
}