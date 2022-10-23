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
                "description": {
                    "en-US": material.description
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

export const getAnnotaionDeletionStatement = (user, annotation) => {
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
            "id": "http://activitystrea.ms/schema/1.0/delete",
            "display": {
                "en-US": "deleted"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": `http://www.CourseMapper.v2.de/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`,
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/annotation",
                "name": {
                    "en-US": annotation.content.slice(0, 70) + ' ...'
                },
                "description": {
                    "en-US": annotation.content
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/annotation":{
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
            }
        },
        "context":{
            "platform": "CourseMapper",
            "language": "en-US"
        }
    }
}

export const getAnnotationLikeStatement = (user, annotation) => {
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
            "id": "http://activitystrea.ms/schema/1.0/like",
            "display": {
                "en-US": "liked"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": `http://www.CourseMapper.v2.de/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/annotation",
                "name": {
                    "en-US": 'Annotation:' + annotation.content.slice(0, 50) + (annotation.content.length > 50 ? ' ...' : '')
                },
                "description": {
                    "en-US": annotation.content
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/annotation":{
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
            }
        },
        "context":{
            "platform": "CourseMapper",
            "language": "en-US"
        }
    }
}

export const getAnnotationUnlikeStatement = (user, annotation) => {
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
            "id": "http://activitystrea.ms/schema/1.0/unlike",
            "display": {
                "en-US": "unliked"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": `http://www.CourseMapper.v2.de/activity/course/${annotation.courseId}/topic/${annotation.topicId}/channel/${annotation.channelId}/material/${annotation.materialId}/annotation/${annotation._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/annotation",
                "name": {
                    "en-US": 'Annotation:' + annotation.content.slice(0, 50) + (annotation.content.length > 50 ? ' ...' : '')
                },
                "description": {
                    "en-US": annotation.content
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/annotation":{
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
            }
        },
        "context":{
            "platform": "CourseMapper",
            "language": "en-US"
        }
    }
}

export const getMaterialDislikeStatement = (user, channel) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return 
}

export const getChannelEditStatement = (user, newChannel, oldtChannel) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return 
}