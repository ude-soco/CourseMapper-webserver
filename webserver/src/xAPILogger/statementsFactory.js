import { v4 as uuidv4 } from 'uuid';
export const getCourseCreationStatement = (fullname, username, course) => {
    return {
        "id": uuidv4(),
        "timestamp": new Date(),
        "actor": {
            "objectType": "Agent",
            "name": fullname,
            "account": {
                "homePage": "http://www.CourseMapper.v2.de",
                "name": username
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
                        "shortname": course.shortname,
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