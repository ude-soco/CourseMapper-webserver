import { v4 as uuidv4 } from 'uuid';
export const getCourseCreationStatement = (user, course) => {
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
            "id": `http://www.CourseMapper.v2.de/activity/course/${course._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/course",
                "name": {
                    "en-US": course.name
                },
                "description":{
                    "en-US": course.description
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/course": {
                        "id": course._id,
                        "name": course.name,
                        "shortname": course.shortName,
                        "description": course.description
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

export const getCourseDeletionStatement = (user, course) => {
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
            "id": `http://www.CourseMapper.v2.de/activity/course/${course._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/course",
                "name": {
                    "en-US": course.name
                },
                "description":{
                    "en-US": course.description
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/course": {
                        "id": course._id,
                        "name": course.name,
                        "shortname": course.shortName,
                        "description": course.description
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

export const getCourseAccessStatement = (user, course) => {
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
            "id": `http://www.CourseMapper.v2.de/activity/course/${course._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/course",
                "name": {
                    "en-US": course.name
                },
                "description":{
                    "en-US": course.description
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/course": {
                        "id": course._id,
                        "name": course.name,
                        "shortname": course.shortName,
                        "description": course.description
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

export const getCourseEnrollmentStatement = (user, course) => {
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
            "id": "http://www.CourseMapper.v2.de/verb/enrolled",
            "display": {
                "en-US": "enrolled in"
            }
        },
        "object": {
            "objectType": "Activity",
            "id":  `http://www.CourseMapper.v2.de/activity/course/${course._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/course",
                "name": {
                    "en-US": course.name
                },
                "description":{
                    "en-US": course.description
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/course": {
                        "id": course._id,
                        "name": course.name,
                        "shortname": course.shortName,
                        "description": course.description
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

export const getCourseWithdrawStatement = (user, course) => {
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
            "id": "http://www.CourseMapper.v2.de/verb/withdrew",
            "display": {
                "en-US": "withdrew from"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": `http://www.CourseMapper.v2.de/activity/course/${course._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/course",
                "name": {
                    "en-US": course.name
                },
                "description":{
                    "en-US": course.description
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/course": {
                        "id": course._id,
                        "name": course.name,
                        "shortname": course.shortName,
                        "description": course.description
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