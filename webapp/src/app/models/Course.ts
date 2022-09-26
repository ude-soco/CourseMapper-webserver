export interface Course{
    _id: string,
    name: string,
    role?: string,
    shortName?: string,
    description?: string,
    numberTopics?: number,
    notification?: number,
    numberChannels?: number,
    numberUsers?: number
}