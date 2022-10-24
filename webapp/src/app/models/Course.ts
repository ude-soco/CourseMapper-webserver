export interface Course{
    _id: string,
    name: string,
    shortName?: string,
    description?: string,
    role?: string,
    numberTopics?: number,
    notification?: number,
    numberChannels?: number,
    numberUsers?: number
}