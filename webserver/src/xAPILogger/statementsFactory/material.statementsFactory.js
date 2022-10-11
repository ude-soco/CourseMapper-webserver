import { v4 as uuidv4 } from 'uuid';
export const getMaterialUploadStatement = (user, material) => {
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
            "id": "http://www.CourseMapper.v2.de/verb/uploaded",
            "display": {
                "en-US": "uploaded"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": `http://www.CourseMapper.v2.de/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`, 
            "definition": {
                "type": `http://www.CourseMapper.v2.de/activityType/material/${material.type}`,
                "name": {
                    "en-US": material.name
                },
                "description": {
                    "en-US": material.description
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/material": {
                        "id": material._id,
                        "name": material.name,
                        "description": material.description,
                        "type": material.type,
                        "channel_id": material.channelId,
                        "topic_id": material.topicId,
                        "course_id": material.courseId
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

export const getMaterialAccessStatement = (user, material) => {
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
            "id": `http://www.CourseMapper.v2.de/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`, 
            "definition": {
                "type": `http://www.CourseMapper.v2.de/activityType/material/${material.type}`,
                "name": {
                    "en-US": material.name
                },
                "description": {
                    "en-US": material.description
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/material": {
                        "id": material._id,
                        "name": material.name,
                        "description": material.description,
                        "type": material.type,
                        "channel_id": material.channelId,
                        "topic_id": material.topicId,
                        "course_id": material.courseId
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

export const getVideoPlayStatement = (user, material) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return 
}

export const getVideoPauseStatement = (user, material) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return 
}

export const getVideoEndStatement = (user, material) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return 
}