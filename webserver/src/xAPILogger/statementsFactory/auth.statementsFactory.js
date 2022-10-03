import { v4 as uuidv4 } from 'uuid';


export const getLoginStatement = (user) => {
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
            "id": "http://www.CourseMapper.v2.de/verb/sinedin",
            "display": {
                "en-US": "signed in"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": "http://www.CourseMapper.v2.de/activity/CourseMapper", 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/homepage",
                "name": {
                    "en-US": "CourseMapper Homepage"
                }
            }
        },
        "context":{
            "platform": "CourseMapper",
            "language": "en-US"
        }
    }
}

export const getLogoutStatement = (user) => {
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
            "id": "http://www.CourseMapper.v2.de/verb/signedout",
            "display": {
                "en-US": "signed out"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": "http://www.CourseMapper.v2.de/activity/CourseMapper", 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/CourseMapper",
                "name": {
                    "en-US": "CourseMapper"
                }
            }
        },
        "context":{
            "platform": "CourseMapper",
            "language": "en-US"
        }
    }
}

export const getSignupStatement = (user) => {
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
            "id": "http://www.CourseMapper.v2.de/verb/signedup",
            "display": {
                "en-US": "signed up"
            }
        },
        "object": {
            "objectType": "Activity",
            "id": "http://www.CourseMapper.v2.de/activity/CourseMapper", 
            "definition": {
                "type": "http://www.CourseMapper.v2.de/activityType/CourseMapper",
                "name": {
                    "en-US": "CourseMapper"
                }
            }
        },
        "context":{
            "platform": "CourseMapper",
            "language": "en-US"
        }
    }

}