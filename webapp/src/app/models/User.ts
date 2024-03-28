import { Course } from "./Course";

export interface User{
    id: string,
    name: string,
    username: string,
    role: string,
    email: string,
    mbox_sha1sum: string,
    courses: Course[],
    jwt:string,
}