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
                        "url": material.url,
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
                        "url": material.url,
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

export const getMaterialDeletionStatement = (user, material) => {
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
                        "url": material.url,
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

export const getMaterialEditStatement = (user, newMaterial, oldMaterial) => {
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
            "id": `http://www.CourseMapper.v2.de/activity/course/${oldMaterial.courseId}/topic/${oldMaterial.topicId}/channel/${oldMaterial.channelId}/material/${oldMaterial._id}`, 
            "definition": {
                "type": `http://www.CourseMapper.v2.de/activityType/material/${oldMaterial.type}`,
                "name": {
                    "en-US": oldMaterial.name
                },
                "description": {
                    "en-US": oldMaterial.description
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/material": {
                        "id": oldMaterial._id,
                        "name": oldMaterial.name,
                        "description": oldMaterial.description,
                        "type": oldMaterial.type,
                        "url": oldMaterial.url,
                        "channel_id": oldMaterial.channelId,
                        "topic_id": oldMaterial.topicId,
                        "course_id": oldMaterial.courseId
                    }
                }
            }
        },
        "result":{
            "extensions":{
                "http://www.CourseMapper.v2.de/extensions/material": {
                    "name": newMaterial.name,
                    "description": newMaterial.description,
                    "url": newMaterial.url,
                    "type":newMaterial.type
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