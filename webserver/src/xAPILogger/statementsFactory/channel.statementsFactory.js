import { v4 as uuidv4 } from 'uuid';
import { channel } from '../../models';
export const getChannelCreationStatement = (user, channel) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return {
        "id": uuidv4(),
        "timestamp": new Date(),
        "actor": {
            "objectType": "Agent",
            "name": fullname,
            "account": {
                "homePage": "http://www.CourseMapper.v2.de",
                "name": user.username
            }
        },
        "verb": {
            "id": "http://www.CourseMapper.v2.de/verb/created",
            "display": {
                "en-US": "created"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": `http://www.CourseMapper.v2.de/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/channel",
                "name": {
                    "en-US": channel.name
                },
                "description": {
                    "en-US": channel.description
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/channel": {
                        "id": channel._id,
                        "course_id": channel.courseId,
                        "topic_id": channel.topicId,
                        "name": channel.name,
                        "description": channel.description
                    }
                }
            }
        },
        "context":{
            "platform": "CourseMapper",
            "language": "en-US"
        }
    }
}

export const getChannelDeletionStatement = (user, channel) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return {
        "id": uuidv4(),
        "timestamp": new Date(),
        "actor": {
            "objectType": "Agent",
            "name": fullname,
            "account": {
                "homePage": "http://www.CourseMapper.v2.de",
                "name": user.username
            }
        },
        "verb": {
            "id": "http://www.CourseMapper.v2.de/verb/deleted",
            "display": {
                "en-US": "deleted"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": `http://www.CourseMapper.v2.de/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/channel",
                "name": {
                    "en-US": channel.name
                },
                "description": {
                    "en-US": channel.description
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/channel": {
                        "id": channel._id,
                        "course_id": channel.courseId,
                        "topic_id": channel.topicId,
                        "name": channel.name,
                        "description": channel.description
                    }
                }
            }
        },
        "context":{
            "platform": "CourseMapper",
            "language": "en-US"
        }
    }
}

export const getChannelAccessStatement = (user, channel) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return {
        "id": uuidv4(),
        "timestamp": new Date(),
        "actor": {
            "objectType": "Agent",
            "name": fullname,
            "account": {
                "homePage": "http://www.CourseMapper.v2.de",
                "name": user.username
            }
        },
        "verb": {
            "id": "http://www.CourseMapper.v2.de/verb/accessed",
            "display": {
                "en-US": "accessed"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": `http://www.CourseMapper.v2.de/activity/course/${channel.courseId}/topic/${channel.topicId}/channel/${channel._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/channel",
                "name": {
                    "en-US": channel.name
                },
                "description": {
                    "en-US": channel.description
                }, 
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/channel": {
                        "id": channel._id,
                        "course_id": channel.courseId,
                        "topic_id": channel.topicId,
                        "name": channel.name,
                        "description": channel.description
                    }
                }
            }
        },
        "context":{
            "platform": "CourseMapper",
            "language": "en-US"
        }
    }
}

export const getChannelEditStatement = (user, newChannel, oldtChannel) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return {
        "id": uuidv4(),
        "timestamp": new Date(),
        "actor": {
            "objectType": "Agent",
            "name": fullname,
            "account": {
                "homePage": "http://www.CourseMapper.v2.de",
                "name": user.username
            }
        },
        "verb": {
            "id": "http://www.CourseMapper.v2.de/verb/edited",
            "display": {
                "en-US": "edited"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": `http://www.CourseMapper.v2.de/activity/course/${oldtChannel.courseId}/topic/${oldtChannel.topicId}/channel/${oldtChannel._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/channel",
                "name": {
                    "en-US": oldtChannel.name
                },
                "description": {
                    "en-US": oldtChannel.description
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/channel": {
                        "id": oldtChannel._id,
                        "course_id": oldtChannel.courseId,
                        "topic_id": oldtChannel.topicId,
                        "name": oldtChannel.name,
                        "description": oldtChannel.description
                    }
                }
            }
        },
        "result":{
            "extensions":{
                "http://www.CourseMapper.v2.de/extensions/channel": {
                    "name": newChannel.name,
                    "description": newChannel.description
                }
            }
        },
        "context":{
            "platform": "CourseMapper",
            "language": "en-US"
        }
    }
}