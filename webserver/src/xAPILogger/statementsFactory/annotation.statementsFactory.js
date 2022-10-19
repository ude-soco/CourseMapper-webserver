import { v4 as uuidv4 } from 'uuid';

export const getAnnotationCreationStatement = (user, annotation, material) => {
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
            "id": "http://risc-inc.com/annotator/verbs/annotated",
            "display": {
                "en-US": "annotated"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": `http://www.CourseMapper.v2.de/activity/course/${material.courseId}/topic/${material.topicId}/channel/${material.channelId}/material/${material._id}`,
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/material",
                "name": {
                    "en-US": material.name
                },
                "extensions": {
                    "http://www.CourseMapper.v2.de/extensions/material": {
                        "id": material._id,
                        "type": material.type,
                        "channel_id": material.channelId,
                        "topic_id": material.topicId,
                        "course_id": material.courseId
                    }
                }
            }
        },
        "result": {
            "extensions": {
                "http://www.CourseMapper.v2.de/extensions/annotation": {
                    "id": annotation._id,
                    "material_id": annotation.materialId,
                    "channel_id": annotation.channelId,
                    "topic_id": annotation.topicId,
                    "course_id": annotation.courseId,
                    "content": annotation.content,
                    "type": annotation.type,
                    "tool": annotation.tool,
                    "location": annotation.location
                }
            }
        },
        "context": {
            "platform": "CourseMapper",
            "language": "en-US"
        }
    }
}

export const getChannelDeletionStatement = (user, annotation) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return 
}

export const getMaterialLikeStatement = (user, channel) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return 
}

export const getMaterialDislikeStatement = (user, channel) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return 
}

export const getChannelEditStatement = (user, newChannel, oldtChannel) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return 
}