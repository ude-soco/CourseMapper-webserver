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
            "id": "http://activitystrea.ms/schema/1.0/create",
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
            "id": "http://activitystrea.ms/schema/1.0/delete",
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
            "id": "http://activitystrea.ms/schema/1.0/access",
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
            "id": "http://www.tincanapi.co.uk/verbs/enrolled_onto_learning_plan",
            "display": {
                "en-US": "enrolled"
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
            "id": "http://activitystrea.ms/schema/1.0/leave",
            "display": {
                "en-US": "left"
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

export const getCourseEditStatement = (user, newCourse, oldCourse) => {
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
            "id": "http://curatr3.com/define/verb/edited",
            "display": {
                "en-US": "edited"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": `http://www.CourseMapper.v2.de/activity/course/${oldCourse._id}`, 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/course",
                "name": {
                    "en-US": oldCourse.name
                },
                "description":{
                    "en-US": oldCourse.description
                },
                "extensions":{
                    "http://www.CourseMapper.v2.de/extensions/course": {
                        "id": oldCourse._id,
                        "name": oldCourse.name,
                        "shortname": oldCourse.shortName,
                        "description": oldCourse.description
                    }
                }
            }
        },
        "result":{
            "extensions":{
                "http://www.CourseMapper.v2.de/extensions/course": {
                    "name": newCourse.name,
                    "shortname": newCourse.shortName,
                    "description": newCourse.description
                }
            }
        },
        "context":{
            "platform": "CourseMapper",
            "language": "en-US"
        }
    }
}