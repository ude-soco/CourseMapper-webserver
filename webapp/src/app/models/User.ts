import { Course } from "./Course";

export interface User{
    id: string,
    name: string,
    username: string,
    role: string,
    email: string,
    courses: Course[],
}