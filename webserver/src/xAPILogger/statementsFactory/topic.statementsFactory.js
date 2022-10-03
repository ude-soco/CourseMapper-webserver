import { v4 as uuidv4 } from 'uuid';
export const getTopicCreationStatement = (user, topic) => {
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
            "id": `http://www.CourseMapper.v2.de/activity/course/${topic.courseId}/topic/${topic._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/topic",
                "name": {
                    "en-US": topic.name
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/topic": {
                        "id": topic._id,
                        "courseId": topic.courseId,
                        "name": topic.name
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

export const getTopicDeletionStatement = (user, topic) => {
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
            "id": `http://www.CourseMapper.v2.de/activity/course/${topic.courseId}/topic/${topic._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/topic",
                "name": {
                    "en-US": topic.name
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/topic": {
                        "id": topic._id,
                        "course_id": topic.courseId,
                        "name": topic.name
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

export const getTopicAccessStatement = (user, topic) => {
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
            "id": `http://www.CourseMapper.v2.de/activity/course/${topic.courseId}/topic/${topic._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/topic",
                "name": {
                    "en-US": topic.name
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/topic": {
                        "id": topic._id,
                        "course_id": topic.courseId,
                        "name": topic.name
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

export const getTopicEditStatement = (user, newTopic, oldtTopic) => {
    const fullname = `${user.firstname} ${user.lastname}`;
    return 
}