
from datetime import datetime
import copy
from collections import defaultdict

statements = []
#activities = collection.find({})
# List of dictionaries (studentActivitiesDict JSON) for each student engagement record. Length = No of unique students
listOfStudentActivityDict = []
listOfStudentActivityDict2 = []
studentActivitiesDict333 = {
    'stdProfile': {
        'stdId': 0000,
        'stdUsername': "",
        'totalSessions':0000,
        'totalSessionTime': 0000,
        'avgSessionTime': 0000,
        'maxSessionTime': 0000,
        'minSessionTime': 0000,
        'totalEnrollments': 0000
    },
    'activitiesProfile': {

        'totalActivities': 0000,
        'annotations': {
            'totalAnnotations': 0000,
            'pdf': {
                'totalPdfAnnotations': 0000,
                'annotationCountTypewise': {
                    'noteTypeAnnotationsOnPdf': 0000,
                    'questionTypeAnnotationsOnPdf': 0000,
                    'externalResourceTypeAnnotationsOnPdf': 0000,
                    'comment': {
                        'noteTypeCommentsOnPdf': 0000,
                        'questionTypeCommentsOnPdf': 0000,
                        'externalResourceTypeCommentsOnPdf': 0000,
                    }
                },
                'annotationTools': {
                    'highlightToolOnPdf': 0000,
                    'pinpointToolOnPdf': 0000,
                    'drawToolOnPdf': 0000,
                }
            },

            'video': {
                'totalVideoAnnotations': 0000,
                'annotationCountTypewise': {
                    'noteTypeAnnotationsOnVid': 0000,
                    'questionTypeAnnotationsOnVid': 0000,
                    'externalResourceTypeAnnotationsOnVid': 0000,
                    'comment': {
                        'noteTypeCommentsOnVid': 0000,
                        'questionTypeCommentsOnVid': 0000,
                        'externalResourceTypeCommentsOnVid': 0000,
                    }
                },
                'annotationTools': {
                    'highlightToolOnVid': 0000,
                    'pinpointToolOnVid': 0000,
                    'drawToolOnVid': 0000,
                }
            }
        },
        'likes': {
            'likesOnAnnotations': {
                'totalLikesOnAnnotations': 0000,
                'likesOnNoteTypeAnnotations': 0000,
                'likesOnQuestionTypeAnnotations': 0000,
                'likesOnExternalResourceTypeAnnotations': 0000,
            },
            'likesOnComments': {
                'likesOnNoteTypeComments': 0000,
                'likesOnQuestionTypeComments': 0000,
                'likesOnExternalResourceTypeComments': 0000,
            },
            'likesOnRepliesOfAnnotations': 0000
        },
        'dislikes': {
            'dislikesOnAnnotations': {
                'totalDislikesOnAnnotations': 0000,
                'dislikesOnNoteTypeAnnotations': 0000,
                'dislikesOnQuestionTypeAnnotations': 0000,
                'dislikesOnExternalResourceTypeAnnotations': 0000,
            },
            'dislikesOnComments': {
                'dislikesOnNoteTypeComments': 0000,
                'dislikesOnQuestionTypeComments': 0000,
                'dislikesExternalResourceTypeComments': 0000,
            },
            'dislikesOnRepliesOfAnnotations': 0000
        },
        'access': {
            'totalAccesses': 0000,
            'courseAccesses': 0000,
            'topicAccesses': 0000,
            'channelAccesses': 0000,
            'materialAccesses': {
                'pdfAccess': 0000,
                'videoAccess': 0000
            }
        },
        'materialProfile': {
            'video': {
                'videosStarted': 0000,
                'videosCompleted': 0000,
                'videosPlayed': 0000,
                'videosPauses': 0000,
                'timeSpentOnVideos': 00.00

            },
            'pdf': {
                'pdfStarted': 0000,
                'pdfCompleted': 0000,
                'slidesViewed':0000,
            }
        }

    }
}
studentActivitiesDict2 =  {
    'stdProfile': {
        'stdId': 0000,
        'stdUsername': "",
        'course_id': "",
       
    },
    'activitiesProfile': {
 
        'totalActivities': 0000,
        'annotations': {
            'totalAddedAnnotations': 0000,
            'totalAnnotationsFollowed': 0000,
            'totalAnnotationsReplied': 0000,
            "totalNoteTypeAnnotations": 0000,
            "totalQuestionTypeAnnotations": 0000,
            "totalExternalResourceTypeAnnotations": 0000,
            'totalPdfAnnotations': 0000,
            'totalVideoAnnotations': 0000,
            "annotationTools":{
                    'highlightToolOnMaterial': 0000,
                    'pinpointToolOnMaterial': 0000,
                    'drawToolOnMaterial': 0000,
            },
            'comment': {
                    'noteTypeCommentsOnMaterial': 0000,
                    'questionTypeCommentsOnMaterial': 0000,
                    'externalResourceTypeCommentsOnMaterial': 0000,
                    }
        },
       
        'likes': {
            'likesOnAnnotations': {
                'totalLikesOnAnnotations': 0000,
                'likesOnNoteTypeAnnotations': 0000,
                'likesOnQuestionTypeAnnotations': 0000,  
                'likesOnExternalResourceTypeAnnotations': 0000,
            },
       
            'likesOnRepliesOfAnnotations': 0000
        },
        'dislikes': {
            'dislikesOnAnnotations': {
                'totalDislikesOnAnnotations': 0000,
                'dislikesOnNoteTypeAnnotations': 0000,
                'dislikesOnQuestionTypeAnnotations': 0000,
                'dislikesOnExternalResourceTypeAnnotations': 0000,
            },
   
            'dislikesOnRepliesOfAnnotations': 0000
        },
        'access': {
            'totalAccesses': 0000,
            'courseAccesses': 0000,
            'topicAccesses': 0000,
            'channelAccesses': 0000,
            'materialAccesses': {
                'pdfAccess': 0000,  
                'videoAccess': 0000
            }
        },
        'dashboardAccess': {
            'totalDashboardAccesses': 0000,
            'courseAccesses': 0000,
            'topicAccesses': 0000,  
            'channelAccesses': 0000,
            'materialAccesses': 0000
        },
 
        'user': {  
            'totalUserMentionedRepliedActivities': 0000,
            'mentioned': 0000,
            'replied': 0000,
        },
 
        'materialProfile': {
            'video': {
                'videosStarted': 0000,
                'videosCompleted': 0000,  
                'videosPlayed': 0000,
                'videosPauses': 0000,
                'timeSpentOnVideos': 00.00
 
            },
            'pdf': {
                'pdfStarted': 0000,
                'pdfCompleted': 0000,
                'slidesViewed':0000,
                'slidesNotUnderstood':0000,
            }
        },
 
        'tag': {  
            'totalAddedTags': 0000,
            'tagsViewed': {
                'totalTagViewed': 0000,
                'courseTagviewed': 0000,  
                'topicTagviewed': 0000,
                'channelTagviewed': 0000,
                'materialTagviewed': 0000,
            }
        },
 
        "knowledgeGraph": {
            "knowledgeGraphAccesses": {
                "totalKnowledgeGraphAccesses": 0000,
                "courseKnowledgeGraphAccesses": 0000,
                "materialKnowledgeGraphAccesses": 0000,
                "slideKnowledgeGraphAccesses": 0000
            },
            "knowledgeGraphViewed": {
                "totalKnowledgeGraphConcept/WikiViewed": 0000,
                "totalKnowledgeGraphConceptViewed": 0000,
                "totalKnowledgeGraphWikiArticleViewed": 0000,
                "courseKnowledgeGraph": {
                    "totalCourseKnowledgeGraphConcept/WikiViewed": 0000,
                    "totalCourseKnowledgeGraphConceptViewed": 0000,
                    "totalCourseKnowledgeGraphWikiArticleViewed": 0000,
            },
                "materialKnowledgeGraphConceptViewed": {
                    "totalMaterialKnowledgeGraphConcept/WikiViewed": 0000,
                    "totalMaterialKnowledgeGraphWikiArticleViewed": 0000,
                    "totalMaterialKnowledgeGraphConceptViewed": 0000,
                    "mainConceptViewed": 0000,
                    "relatedConceptViewed": 0000,
                    "categoryViewed": 0000
                },
                "slideKnowledgeGraphViewed": {
                    "totalSlideKnowledgeGraphConcept/WikiViewed": 0000,
                    "totalSlideKnowledgeGraphWikiArticleViewed": 0000,
                    "totalSlideKnowledgeGraphConceptViewed": 0000,
                    "mainConceptViewed": 0000,
                    "totalRecommendedConcept/WikiViewed": 0000,
                    "totalRecommendedConceptViewed": 0000,
                    "recommendedMaterial": {
                        "totalRecommendedMaterialViewed": 0000,
                        "recommendedArticleViewed":0000,
                        "recommendedVideoViewed":0000,
                    }
                }
            },
            "slideKnowledgeGraphMarked": {
               
                "totalSlideKnowledgeGraphMarked": 0000,
                "totalSlideKnowledgeGraphMarkedUnderstood": 0000,
                "totalSlideKnowledgeGraphMarkedNotUnderstood": 0000,
                "totalSlideKnowledgeGraphMarkedAsNew": 0000,
                "totalRecommendedConceptsMarked": 0000,
                "recommendedConceptsMarkedUnderstood": 0000,
                "recommendedConceptsMarkedNotUnderstood": 0000,
                "recommendedConceptsMarkedMarkedAsNew": 0000,
                "recommendedMaterial": {
                        "totalRecommendedMaterialMarkedHelpful": 0000,
                        "totalRecommendedMaterialMarkedNotHelpful": 0000,
                        "recommendedArticleMarked": {
                            "recommendedArticleMarkedHelpful":0000,
                            "recommendedArticleMarkedNotHelpful":0000,
                        },
                         "recommendedVideoMarked": {
                            "recommendedVideoMarkedHelpful":0000,
                            "recommendedVideoMarkedNotHelpful":0000,
                        }
                    }
            }
        }
}
}

""" def writeToJsonFile(data, filename='studentsActivities1.json'):
    with open(filename,"w") as f:
        json.dump(data,f,indent=2)
 """

def processActivities(mydb):
    # getting the collection mongodb
    collection_activities = mydb["activities"]
    collection_courses = mydb["courses"]
    collection_roles = mydb["roles"]
 
    # Get 'user' role ID
    user_role_doc = collection_roles.find_one({"name": "user"})
    if not user_role_doc:
        print("No role named 'user' found.")
        return
    user_role_id = user_role_doc["_id"]
 
    # Create a mapping: course_id → set of user_ids with 'user' role
    course_user_map = {}
    for course in collection_courses.find({}):
        course_id = str(course["_id"])
        users_in_course = course.get("users", [])
        user_ids = {
            str(user["userId"]) for user in users_in_course
            if user.get("role") == user_role_id
        }
        course_user_map[course_id] = user_ids
       
 
    user_course_activities = defaultdict(lambda: defaultdict(list))
   
    def extract_course_id_from_extensions(extensions):
        for path, data in extensions.items():
            if isinstance(data, dict):
                course_id = data.get('course_id') or data.get('courseId') or data.get('id')
                if course_id:
                    return str(course_id), path
        return None, None
 
    aggr_activities = collection_activities.aggregate([
      {
            "$group": {
                '_id': '$statement.actor.account.name',
                'totalActivities': {'$sum': 1},
                'activities': {
                    '$push': {
                        'verb': '$statement.verb',
                        'object': '$statement.object',
                        'result': '$statement.result',
                        'context': '$statement.context',
                        'timestamp': '$statement.timestamp',
                        "extensions": {
                                "$ifNull": [
                                    "$statement.object.definition.extensions",
                                    {}
                                ]
                            },
                        'totalActivities': '$sum'
                    }
                }
            }
        },  # -1 to sort by latest to oldest
        {
            "$sort": {'statement.timestamp': 1}
        }
])
   
 
 
    aggr_activities_list = list(aggr_activities)

    # for i in aggr_activities_list:  # Loop through aggregated activities
    #     studentActivitiesListAggregated.append([])
    #     listOfStudentActivityDict.append(copy.deepcopy(studentActivitiesDict))

    #     for j in range(len(i['activities'])):
    #         activity = i['activities'][j]
    #         verb_display = activity['verb']['display']['en-US']
    #         object_type = activity['object']['definition']['type'].rsplit('/', 1)[-1]
    #         timestamp = str(activity['timestamp'])

    #         # Extract course_id from multiple possible paths
    #         course_id = None
    #         extensions = activity['object']['definition'].get('extensions', {})
              
    #         for path in possible_paths:
    #             if path in extensions:
    #                 # Check if 'course_id' exists, otherwise fall back to 'id'
    #                 course_id = extensions[path].get('course_id') or extensions[path].get('id')
    #                 if course_id:  # If a valid course_id or id is found, stop the loop
    #                     break

    #         # Construct the log entry with course_id
    #         entry = f"{i['_id']} {verb_display} {object_type} {course_id if course_id else 'None'} {timestamp}"

    #         # Determine activity type
    #         if 'annotated material' in f"{verb_display} {object_type}":
    #             entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"
    #             entry += f" {activity['result']['extensions']['http://www.CourseMapper.de/extensions/annotation']['type']}"
    #             entry += f" {activity['result']['extensions']['http://www.CourseMapper.de/extensions/annotation']['tool']['type']}"
            
    #         elif 'accessed material' in f"{verb_display} {object_type}":
    #             entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"
            
    #         elif 'completed' in verb_display:
    #             entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"

    #         elif 'played video' == f"{verb_display} {object_type}":
    #             entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"
    #             entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('timestamp', 'None')}"

    #         elif 'paused video' == f"{verb_display} {object_type}":
    #             entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"
    #             entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('timestamp', 'None')}"

    #         elif 'viewed slide' == f"{verb_display} {object_type}":
    #             entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('pageNr', 'None')}"

    #         #print(studentActivitiesListAggregated[listCount])
    #         studentActivitiesListAggregated[listCount].append(entry)
    #     listCount = listCount+1
    # #   print(i)
    
    # print(studentActivitiesListAggregated[2])

    for i in aggr_activities_list:
        print(i) # Loop through aggregated activities
        user_id = i['_id']
        #if user_id not in user_only_list:
        #    continue
        # if user_id != "67791606d0a537b9204c9f95":
        #     continue # Extract user ID
   
 
        #for j in range(800, len(i['activities'])):
        for j in range(len(i['activities'])):
            activity = i['activities'][j]
            verb_display = activity['verb']['display']['en-US']
            object_type = activity['object']['definition']['type'].rsplit('/', 1)[-1]
            timestamp = str(activity['timestamp'])
 
            # Extract course_id from multiple possible paths
            course_id = None
            extensions = activity.get('extensions', {})  # Now directly in aggregation!
            course_id, extension_activity = extract_course_id_from_extensions(extensions)
            if not course_id:
                continue
                   
            course_id = str(course_id)
 
            # ✅ Now check: is this user a 'user' in this course?
            if user_id not in course_user_map.get(course_id, set()):
                continue  # Skip activities where user isn't a 'user' in this course
 
 
            # default value
            entry = f"{user_id} {verb_display} {object_type}"
           
            # Determine activity type
 
            if 'paused' in f"{verb_display} {object_type}" or 'played' in f"{verb_display} {object_type}":
                entry += f" {extensions.get(extension_activity, {}).get('id', 'None')}"
                entry += f" {extensions.get(extension_activity, {}).get('timestamp', 'None')}"
                entry += f" {timestamp}"
 
            #   Viewed slide activity [username viewed slide slide_number timestamp]
            #   If the slide_number is 0, means the material is started???????
            elif ('added' in f"{verb_display} {object_type}" or 'asked' in f"{verb_display} {object_type}") and not ('tag' in f"{verb_display} {object_type}"):
                #  Annotation material activity: [username annotated material material_type annotation_type annotation_tool timestamp]
              #  entry += f" {extensions.get(extension_activity, {}).get('type', 'None')}"
               # entry += f" {extensions.get(extension_activity, {}).get('type', 'None')}"
                entry += f" {activity['extensions'][extension_activity]['tool']['type']}"
                entry += f" {timestamp}"
 
            elif 'viewed slide' == f"{verb_display} {object_type}":
                entry += f" {extensions.get(extension_activity, {}).get('material_pageNr', 'None')}"
                entry += f" {timestamp}"
               
            else:
                entry += f" {timestamp}"
 
 
            # Store in the dictionary grouped by user_id and course_id
            user_course_activities[user_id][course_id].append(entry)
 
    # Convert defaultdict to a standard dictionary for output
    user_course_activities = {user: dict(courses) for user, courses in user_course_activities.items()}

# Iterate over user IDs
    index = 0
    for user_id, courses in user_course_activities.items():
        for course_id, activities in courses.items():
            startedVideosIDList = []
            listOfStudentActivityDict2.append(copy.deepcopy(studentActivitiesDict2))
            # Initialize user-course statistics
            playedTimeVidInSeconds=0
            pausedTimeVideoInSeconds=0
            total_sessions = 0
            total_session_time = 0
            total_annotations = 0
            total_likes = 0
            total_dislikes = 0
            listOfStudentActivityDict2[index]['stdProfile']['stdId'] = index+1
            listOfStudentActivityDict2[index]['stdProfile']['stdUsername'] =user_id
            listOfStudentActivityDict2[index]['stdProfile']['course_id'] = str(course_id)

            # Process each activity
            
            listOfStudentActivityDict2[index]['activitiesProfile']['totalActivities'] = len(activities)
            for activity in activities:
                if 'accessed' in activity:
                   
                    splittedThisActivityStringArray=  activity.split(' ')
                    if splittedThisActivityStringArray[2] == 'course':
                        listOfStudentActivityDict2[index]['activitiesProfile']['access']['totalAccesses'] +=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['access']['courseAccesses'] += 1
       
                    elif splittedThisActivityStringArray[2] == 'topic':
                        listOfStudentActivityDict2[index]['activitiesProfile']['access']['totalAccesses'] +=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['access']['topicAccesses'] += 1
 
                    elif splittedThisActivityStringArray[2] == 'channel':
                        listOfStudentActivityDict2[index]['activitiesProfile']['access']['totalAccesses'] +=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['access']['channelAccesses'] += 1
 
                    elif splittedThisActivityStringArray[2] == 'pdf':
                        listOfStudentActivityDict2[index]['activitiesProfile']['access']['totalAccesses'] +=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['access']['materialAccesses']['pdfAccess'] += 1
 
                    elif splittedThisActivityStringArray[2]== 'video' or splittedThisActivityStringArray[2]== 'youtube':
                        listOfStudentActivityDict2[index]['activitiesProfile']['access']['totalAccesses'] +=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['access']['materialAccesses']['videoAccess'] += 1
               
                    elif splittedThisActivityStringArray[2] == 'course-dashboard':
                        listOfStudentActivityDict2[index]['activitiesProfile']['dashboardAccess']['totalDashboardAccesses'] +=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['dashboardAccess']['courseAccesses'] += 1
 
                    elif splittedThisActivityStringArray[2] == 'channel-dashboard':
                        listOfStudentActivityDict2[index]['activitiesProfile']['dashboardAccess']['totalDashboardAccesses'] +=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['dashboardAccess']['channelAccesses'] += 1
 
                    elif splittedThisActivityStringArray[2] == 'topic-dashboard':
                        listOfStudentActivityDict2[index]['activitiesProfile']['dashboardAccess']['totalDashboardAccesses'] +=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['dashboardAccess']['topicAccesses'] += 1
 
                    elif splittedThisActivityStringArray[2]== 'material-dashboard':
                        listOfStudentActivityDict2[index]['activitiesProfile']['dashboardAccess']['totalDashboardAccesses'] +=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['dashboardAccess']['materialAccesses'] += 1
 
                    elif splittedThisActivityStringArray[2] == 'course-knowledge-graph':
                        listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphAccesses']['totalKnowledgeGraphAccesses'] +=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphAccesses']['courseKnowledgeGraphAccesses'] +=1
 
                    elif splittedThisActivityStringArray[2] == 'material-knowledge-graph':
                        listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphAccesses']['totalKnowledgeGraphAccesses'] +=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphAccesses']['materialKnowledgeGraphAccesses'] +=1
 
                    elif splittedThisActivityStringArray[2]== 'slide-knowledge-graph':
                        listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphAccesses']['totalKnowledgeGraphAccesses'] +=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphAccesses']['slideKnowledgeGraphAccesses'] +=1
                
                elif 'added' in activity or 'asked' in activity:
                   
                    splittedThisActivityStringArray=  activity.split(' ')
               
                    if splittedThisActivityStringArray[2] == 'note':
                        listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['totalAddedAnnotations']+=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['annotations']["totalNoteTypeAnnotations"]+= 1
                        if splittedThisActivityStringArray[3] == 'comment':
                            listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['comment']["noteTypeCommentsOnMaterial"]+= 1

 
                    elif splittedThisActivityStringArray[2] == 'question':
                        listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['totalAddedAnnotations']+=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['totalQuestionTypeAnnotations'] += 1
                        if splittedThisActivityStringArray[3] == 'comment':
                            listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['comment']["questionTypeCommentsOnMaterial"]+= 1
 
                    elif splittedThisActivityStringArray[2] == 'external-resource':
                        listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['totalAddedAnnotations']+=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['annotations']["totalExternalResourceTypeAnnotations"]+= 1
                        if splittedThisActivityStringArray[3] == 'comment':
                            listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['comment']["externalResourceTypeCommentsOnMaterial"]+= 1

                    elif splittedThisActivityStringArray[2] == 'tag':
                        listOfStudentActivityDict2[index]['activitiesProfile']['tag']['totalAddedTags'] += 1

                    if splittedThisActivityStringArray[3] == 'pinpoint':
                        listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['annotationTools']["pinpointToolOnMaterial"]+= 1
                    elif splittedThisActivityStringArray[3] == 'draw':
                        listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['annotationTools']["drawToolOnMaterial"]+= 1
                    elif splittedThisActivityStringArray[3] == 'highlight':
                        listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['annotationTools']["highlightToolOnMaterial"]+= 1
       
                   
                # PDFs completed
                elif 'completed' in activity:
                    splittedThisActivityStringArray=  activity.split(' ')
                    if  splittedThisActivityStringArray[2] == 'pdf':
                        listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['pdf']['pdfCompleted'] +=1
 
                    elif splittedThisActivityStringArray[2] == 'video' or splittedThisActivityStringArray[2] == 'youtube':
                        listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['video']['videosCompleted'] +=1
           
 
                elif 'did not understand slide' in activity:
 
                    listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['pdf']['slidesNotUnderstood'] +=1
 
                # Total Annotations
                elif 'annotated' in activity:
                   
                    # Total PDF Annotations
                    if 'annotated pdf' in activity:
                        listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['totalPdfAnnotations'] +=1
 
 
                    # Video Annotations
                    # Total Video Annotations
                    #  Annotation material activity: [username annotated material material_type annotation_type annotation_tool timestamp]
                    elif 'annotated video' in activity or 'annotated youtube' in activity:
                        listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['totalVideoAnnotations'] += 1
                   
                       
 
                elif 'viewed slide' in activity:
                    listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['pdf']['slidesViewed']+=1
               
                    splittedThisActivityStringArray=  activity.split(' ')
                    if splittedThisActivityStringArray[3]=='1':
 
                        listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['pdf']['pdfStarted'] +=1
 
                   
                elif 'viewed' in activity:
                    splittedThisActivityStringArray=  activity.split(' ')
                    if splittedThisActivityStringArray[1] == "viewed":
 
                        if splittedThisActivityStringArray[2]=='course-tag':
                            listOfStudentActivityDict2[index]['activitiesProfile']['tag']['tagsViewed']['totalTagViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['tag']['tagsViewed']['courseTagviewed'] += 1
 
                        elif splittedThisActivityStringArray[2] == 'topic-tag':
                            listOfStudentActivityDict2[index]['activitiesProfile']['tag']['tagsViewed']['totalTagViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['tag']['tagsViewed']['topicTagviewed'] += 1
                               
                        elif splittedThisActivityStringArray[2] == 'channel-tag':
                            listOfStudentActivityDict2[index]['activitiesProfile']['tag']['tagsViewed']['totalTagViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['tag']['tagsViewed']['channelTagviewed'] += 1
                               
                        elif splittedThisActivityStringArray[2]  == 'material-tag':
                            listOfStudentActivityDict2[index]['activitiesProfile']['tag']['tagsViewed']['totalTagViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['tag']['tagsViewed']['materialTagviewed'] += 1
                               
                        elif splittedThisActivityStringArray[2]  == 'course-kg-main-concept' or splittedThisActivityStringArray[3]  == 'course-kg-main-concept':
 
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConcept/WikiViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConceptViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['courseKnowledgeGraph']['totalCourseKnowledgeGraphConcept/WikiViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['courseKnowledgeGraph']['totalCourseKnowledgeGraphConceptViewed'] += 1
                       
                        elif splittedThisActivityStringArray[2]  == 'material-kg-main-concept' or splittedThisActivityStringArray[3]  == 'material-kg-main-concept':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConcept/WikiViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConceptViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['materialKnowledgeGraphConceptViewed']['totalMaterialKnowledgeGraphConcept/WikiViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['materialKnowledgeGraphConceptViewed']['totalMaterialKnowledgeGraphConceptViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['materialKnowledgeGraphConceptViewed']['mainConceptViewed'] += 1
                   
                        elif splittedThisActivityStringArray[2]  == 'material-kg-related-concept' or splittedThisActivityStringArray[3]  == 'material-kg-related-concept':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConcept/WikiViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConceptViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['materialKnowledgeGraphConceptViewed']['totalMaterialKnowledgeGraphConcept/WikiViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['materialKnowledgeGraphConceptViewed']['totalMaterialKnowledgeGraphConceptViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['materialKnowledgeGraphConceptViewed']['relatedConceptViewed'] += 1
                   
                        elif splittedThisActivityStringArray[2]  == 'material-kg-category' or splittedThisActivityStringArray[3]  == 'material-kg-category':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConcept/WikiViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConceptViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['materialKnowledgeGraphConceptViewed']['totalMaterialKnowledgeGraphConcept/WikiViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['materialKnowledgeGraphConceptViewed']['totalMaterialKnowledgeGraphConceptViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['materialKnowledgeGraphConceptViewed']['categoryViewed'] += 1
                   
                               
                        elif splittedThisActivityStringArray[2]  == 'slide-kg-main-concept' or splittedThisActivityStringArray[3]  == 'slide-kg-main-concept':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConcept/WikiViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConceptViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['slideKnowledgeGraphViewed']['totalSlideKnowledgeGraphConcept/WikiViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['slideKnowledgeGraphViewed']['totalSlideKnowledgeGraphConceptViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['slideKnowledgeGraphViewed']['mainConceptViewed'] += 1
                   
 
                        elif splittedThisActivityStringArray[2]  == 'slide-kg-recommended-concept' or splittedThisActivityStringArray[3]  == 'slide-kg-recommended-concept': ###### starting herre recommended concepts and material
                            #listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConcept/WikiViewed'] += 1
                            #listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConceptViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['slideKnowledgeGraphViewed']['totalRecommendedConcept/WikiViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['slideKnowledgeGraphViewed']['totalRecommendedConceptViewed'] += 1
                           
                        elif splittedThisActivityStringArray[2]  == 'recommended-article' or splittedThisActivityStringArray[3]  == 'recommended-article':
                           
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['slideKnowledgeGraphViewed']['recommendedMaterial']["totalRecommendedMaterialViewed"] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['slideKnowledgeGraphViewed']['recommendedMaterial']["recommendedArticleViewed"] += 1
                         
                         
                        elif splittedThisActivityStringArray[2]  == 'recommended-video' or splittedThisActivityStringArray[3]  == 'recommended-video':
                           
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['slideKnowledgeGraphViewed']['recommendedMaterial']["totalRecommendedMaterialViewed"] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['slideKnowledgeGraphViewed']['recommendedMaterial']["recommendedVideoViewed"] += 1
                         
                         
                   
                        elif  'viewed full article' in activity:
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConcept/WikiViewed'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphWikiArticleViewed'] += 1
 
                            if splittedThisActivityStringArray[4]  == 'course-kg-main-concept':
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["courseKnowledgeGraph"]['totalCourseKnowledgeGraphConcept/WikiViewed'] += 1
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["courseKnowledgeGraph"]['totalCourseKnowledgeGraphWikiArticleViewed'] += 1
                           
                            elif splittedThisActivityStringArray[4]  == 'material-kg-main-concept'  or splittedThisActivityStringArray[4]  == 'material-kg-related-concept' or splittedThisActivityStringArray[4]  == 'material-kg-category':
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["materialKnowledgeGraphConceptViewed"]['totalMaterialKnowledgeGraphConcept/WikiViewed'] += 1
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["materialKnowledgeGraphConceptViewed"]['totalMaterialKnowledgeGraphWikiArticleViewed'] += 1
 
                            elif splittedThisActivityStringArray[4]  == 'slide-kg-main-concept' or splittedThisActivityStringArray[4]  == 'slide-kg-related-concept':
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["slideKnowledgeGraphViewed"]['totalSlideKnowledgeGraphConcept/WikiViewed'] += 1
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["slideKnowledgeGraphViewed"]['totalSlideKnowledgeGraphWikiArticleViewed'] += 1
 
                elif 'marked' in activity:
                    splittedThisActivityStringArray=  activity.split(' ')
                   
                    if splittedThisActivityStringArray[4]  == 'slide-kg-main-concept' or splittedThisActivityStringArray[5]  == 'slide-kg-main-concept':
 
                       
                        if  splittedThisActivityStringArray[3] == 'understood':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['slideKnowledgeGraphMarked']['totalSlideKnowledgeGraphMarkedUnderstood'] += 1
                        elif  splittedThisActivityStringArray[3] == 'new':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['slideKnowledgeGraphMarked']['totalSlideKnowledgeGraphMarkedAsNew'] += 1
                        elif  splittedThisActivityStringArray[3] + splittedThisActivityStringArray[4]  == 'notunderstood':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['slideKnowledgeGraphMarked']['totalSlideKnowledgeGraphMarkedNotUnderstood'] += 1
                   
                    elif splittedThisActivityStringArray[4]  == 'slide-kg-recommended-concept' or splittedThisActivityStringArray[5]  == 'slide-kg-recommended-concept':
 
                       
                        if  splittedThisActivityStringArray[3] == 'understood':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['slideKnowledgeGraphMarked']['recommendedConceptsMarkedUnderstood'] += 1
                        elif  splittedThisActivityStringArray[3] == 'new':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['slideKnowledgeGraphMarked']['recommendedConceptsMarkedMarkedAsNew'] += 1
                        elif  splittedThisActivityStringArray[3] + splittedThisActivityStringArray[4]  == 'notunderstood':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['slideKnowledgeGraphMarked']['recommendedConceptsMarkedNotUnderstood'] += 1
                   
                    elif 'marked as helpful' in activity:
                        listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['slideKnowledgeGraphMarked']['recommendedMaterial']['totalRecommendedMaterialMarkedHelpful'] += 1
                        if  splittedThisActivityStringArray[4] == 'recommended-video':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['slideKnowledgeGraphMarked']['recommendedMaterial']['recommendedVideoMarked']['recommendedVideoMarkedHelpful'] += 1
               
                        elif  splittedThisActivityStringArray[4] == 'recommended-article':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['slideKnowledgeGraphMarked']['recommendedMaterial']['recommendedArticleMarked']['recommendedArticleMarkedHelpful'] += 1
               
                    elif 'marked as not helpful' in activity:
                        listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['slideKnowledgeGraphMarked']['recommendedMaterial']['totalRecommendedMaterialMarkedNotHelpful'] += 1
                        if  splittedThisActivityStringArray[5] == 'recommended-video':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['slideKnowledgeGraphMarked']['recommendedMaterial']['recommendedVideoMarked']['recommendedVideoMarkedNotHelpful'] += 1
               
                        elif  splittedThisActivityStringArray[5] == 'recommended-article':
                            listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['slideKnowledgeGraphMarked']['recommendedMaterial']['recommendedArticleMarked']['recommendedArticleMarkedNotHelpful'] += 1
               
                               
                   
                elif 'liked' in activity:
                    splittedThisActivityStringArray=  activity.split(' ')
                    if  splittedThisActivityStringArray[1] == 'liked':
 
                   
                       
                        if splittedThisActivityStringArray[2] == 'note':
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnNoteTypeAnnotations'] += 1
                         
                               
                        elif splittedThisActivityStringArray[2] == 'question':
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnQuestionTypeAnnotations'] += 1
                               
                        elif splittedThisActivityStringArray[2]  == 'external-resource':
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnExternalResourceTypeAnnotations'] += 1
                               
 
                        elif splittedThisActivityStringArray[2]=='reply':
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnRepliesOfAnnotations'] += 1
 
                    elif  splittedThisActivityStringArray[1] == 'unliked':
 
                        if splittedThisActivityStringArray[2] == 'note':
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations'] -= 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnNoteTypeAnnotations'] -= 1
                         
                               
                        elif splittedThisActivityStringArray[2] == 'question':
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations'] -= 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnQuestionTypeAnnotations'] -= 1
                               
                        elif splittedThisActivityStringArray[2]  == 'external-resource':
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations'] -= 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnExternalResourceTypeAnnotations'] -= 1
                               
 
                        elif splittedThisActivityStringArray[2]=='reply':
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnRepliesOfAnnotations'] -= 1
 
                    elif  splittedThisActivityStringArray[1] == 'disliked':
                     
                        if splittedThisActivityStringArray[2] == 'note':
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations'] += 1
                         
                               
                        elif splittedThisActivityStringArray[2] == 'question':
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations'] += 1
                               
                        elif splittedThisActivityStringArray[2]  == 'external-resource':
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations'] += 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations'] += 1
                               
 
                       
                        elif splittedThisActivityStringArray[2]=='reply':
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnRepliesOfAnnotations'] += 1
                   
                    elif  splittedThisActivityStringArray[1] == 'un-disliked':
                        if splittedThisActivityStringArray[2] == 'note':
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations'] -= 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations'] -= 1
                         
                               
                        elif splittedThisActivityStringArray[2] == 'question':
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations'] -= 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations'] -= 1
                               
                        elif splittedThisActivityStringArray[2]  == 'external-resource':
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations'] -= 1
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations'] -= 1
                               
 
                       
                        elif splittedThisActivityStringArray[2]=='reply':
                            listOfStudentActivityDict2[index]['activitiesProfile']['dislikes']['dislikesOnRepliesOfAnnotations'] -= 1
 
 
                elif 'played' in activity:      
                    splittedThisActivityStringArray=  activity.split(' ')
                    if 'video' == splittedThisActivityStringArray[2] or 'youtube' == splittedThisActivityStringArray[2]:
                        listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['video']['videosPlayed'] += 1
                        playedTimeVidInSeconds = playedTimeVidInSeconds+int(splittedThisActivityStringArray[4])
                    #    x=set(startedVideosIDList)
                    #    y=len(set(startedVideosIDList))
                        if splittedThisActivityStringArray[4]=='0': # Meaning that the video is played from the beginning
                            startedVideosIDList.append(splittedThisActivityStringArray[3])
         
                # Pauses in videos
                elif 'paused' in activity:
                        splittedThisActivityStringArray=  activity.split(' ')
                        if 'video' == splittedThisActivityStringArray[2] or 'youtube' == splittedThisActivityStringArray[2]:
                            pausedTimeVideoInSeconds = pausedTimeVideoInSeconds+int(splittedThisActivityStringArray[4])
                            listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['video']['videosPauses'] +=1
 
                elif 'mentioned user' in activity:
                    listOfStudentActivityDict2[index]['activitiesProfile']['user']['totalUserMentionedRepliedActivities']+=1
                    listOfStudentActivityDict2[index]['activitiesProfile']['user']['mentioned']+=1
 
                elif 'replied' in activity:
                    splittedThisActivityStringArray=  activity.split(' ')
                    if 'user' == splittedThisActivityStringArray[2]:
                        listOfStudentActivityDict2[index]['activitiesProfile']['user']['totalUserMentionedRepliedActivities']+=1
                        listOfStudentActivityDict2[index]['activitiesProfile']['user']['replied']+=1
 
                    else:
                        listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['totalAnnotationsReplied'] +=1
                    # splittedThisActivityStringArray=  activity.split(' ')
                    # if 'note' == splittedThisActivityStringArray[2]:
                    #     listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['note']['noteReplied'] +=1
                    # elif 'question' == splittedThisActivityStringArray[2]:
                    #     listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['question']['questionReplied'] +=1
                    # elif 'external-resource' == splittedThisActivityStringArray[2]:
                    #     listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['externalResource']['externalResourceReplied'] +=1
 
                # elif 'edited' in activity:
                #     splittedThisActivityStringArray=  activity.split(' ')
                #     if 'note' == splittedThisActivityStringArray[2]:
                #         listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['note']['noteEdited'] +=1
                #     elif 'question' == splittedThisActivityStringArray[2]:
                #         listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['question']['questionEdited'] +=1
                #     elif 'external-resource' == splittedThisActivityStringArray[2]:
                #         listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['externalResource']['externalResourceEdited'] +=1
               
                elif 'followed' in activity:
                    listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['totalAnnotationsFollowed'] +=1
                 
                   
                else:
                    print("nothing", activity)
               
            listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['video']['videosStarted']=len(set(startedVideosIDList))
         
            # Total time spent on videos
            listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['video']['timeSpentOnVideos']=pausedTimeVideoInSeconds-playedTimeVidInSeconds
            # Total time spent on youtube
            index = index +1
 
    return listOfStudentActivityDict2
    '''
                if activity["activity"] == "logged in":
                    total_sessions += 1
                    total_session_time += activity.get("sessionTime", 0)
                total_annotations += activity.get("annotations", 0)
                total_likes += activity.get("likes", 0)
                total_dislikes += activity.get("dislikes", 0)
            
            # Append structured data
            final_data.append({
                "stdId": user_id,
                "courseId": course_id,
                "totalSessions": total_sessions,
                "totalSessionTime": total_session_time,
                "totalAnnotations": total_annotations,
                "totalLikes": total_likes,
                "totalDislikes": total_dislikes,
            })
            '''
    # Converting timestamp string to python identifiable format, to get the time in seconds or minutes
    """ print(datetime.now())
    login='2023-03-02 20:16:07.552000'
    logout='2023-02-09 12:44:56.299000'
    loginT=datetime.strptime(login, "%Y-%m-%d %H:%M:%S.%f")
    logoutT=datetime.strptime(logout, "%Y-%m-%d %H:%M:%S.%f")
    diff=logoutT-loginT
    diff.seconds/60 """


    """ print(stdActivitiesJSON['activitiesProfile']['totalActivities'])
    jsonString = json.dumps(stdActivitiesJSON, indent=2)
    #print(jsonString[0]) """
    # print(stdActivitiesDict['stdProfile']['totalEnrollments'])


    # print(stdActivitiesDict['stdProfile']['totalEnrollments'])
    """ 
    for i in range(listCount):  #Create list of dictionaries as many as number of results from aggregation (listindex)
        listOfStudentActivityDict.append(studentActivitiesDict) """

    # print(listOfStudentActivityDict)

    # print(type(listOfStudentActivityDict))
    # print(type(listOfStudentActivityDict[0]))

    '''
    for ActList in stdActList:
        for activity in ActList:
            if 'enrolled course' in activity: #No. of enrollments
            studentActivitiesDict['stdProfile']['totalEnrollments']=studentActivitiesDict['stdProfile']['totalEnrollments']+1
            if 'completed pdf' in activity: #pdf completed
                studentActivitiesDict['activitiesProfile']['materialCompletion']['pdf']=studentActivitiesDict['activitiesProfile']['materialCompletion']['pdf']+1
    '''

    # print(range(len(listOfStudentActivityDict)))
    # print(range(len(studentActivitiesListAggregated)))


    # for i in range(len(listOfStudentActivityDict)):
    #    print(listOfStudentActivityDict[i])
    # for ActivityList in studentActivitiesListAggregated:
    #    print(ActivityList)
    #   for activity in ActivityList:
    #      if 'enrolled course' in activity: #No. of enrollments
    #         listOfStudentActivityDict[i]['stdProfile']['totalEnrollments']=listOfStudentActivityDict[i]['stdProfile']['totalEnrollments']+1


    # for i in listOfStudentActivityDict:
    #   print(i)


####dawar stop here

    # for listIndex in range(len(studentActivitiesListAggregated)):
    #     playedTimeInSeconds=0
    #     pausedTimeInSeconds=0
    #     allVideos=[video]
    #     startedVideosIDList = []
    #     listOfStudentActivityDict[listIndex]['stdProfile']['stdUsername'] = studentActivitiesListAggregated[listIndex][0].split(' ')[
    #         0]
    #     listOfStudentActivityDict[listIndex]['stdProfile']['stdId'] = listIndex+1
    #     for itemIndex in range(len(studentActivitiesListAggregated[listIndex])):

    #         # Total activities
    #         listOfStudentActivityDict[listIndex]['activitiesProfile']['totalActivities'] = len(
    #             studentActivitiesListAggregated[listIndex])

    #         # Count Total Enrollments
    #         if 'enrolled course' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #             listOfStudentActivityDict[listIndex]['stdProfile'][
    #                 'totalEnrollments'] = listOfStudentActivityDict[listIndex]['stdProfile']['totalEnrollments']+1

    #         # Max session time
    #         # Min session time
    #         # Avg session time
    #         # Total Number of Sessions
    #         elif 'logged in' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                 listOfStudentActivityDict[listIndex]['stdProfile'][
    #                 'totalSessions'] = listOfStudentActivityDict[listIndex]['stdProfile']['totalSessions']+1


    #         # Annotations

    #         # Total Annotations
    #         elif 'annotated material' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #             listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations'][
    #                 'totalAnnotations'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['totalAnnotations']+1

    #             # Total PDF Annotations
    #             if 'annotated material pdf' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                 listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf'][
    #                     'totalPdfAnnotations'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['totalPdfAnnotations']+1

    #                 # PDF Annotation Tools (draw, pinpoint, highlight)
    #                 if 'highlight' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationTools'][
    #                         'highlightToolOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationTools']['highlightToolOnPdf']+1
    #                 if 'pinpoint' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationTools'][
    #                         'pinpointToolOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationTools']['pinpointToolOnPdf']+1
    #                 if 'draw' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationTools'][
    #                         'drawToolOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationTools']['drawToolOnPdf']+1

    #                 # Annotation Types (Note, Question, External Resource)
    #                 if 'annotated material pdf Question' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise'][
    #                         'questionTypeAnnotationsOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['questionTypeAnnotationsOnPdf']+1
    #                 if 'annotated material pdf Note' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise'][
    #                         'noteTypeAnnotationsOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['noteTypeAnnotationsOnPdf']+1
    #                 if 'annotated material pdf External Resource' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise'][
    #                         'externalResourceTypeAnnotationsOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['externalResourceTypeAnnotationsOnPdf']+1

    #                 # Comments and types (Annotations without using tool)
    #                 if 'annotated material pdf External Resource annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['comment'][
    #                         'externalResourceTypeCommentsOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['comment']['externalResourceTypeCommentsOnPdf']+1
    #                 if 'annotated material pdf Question annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['comment'][
    #                         'questionTypeCommentsOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['comment']['questionTypeCommentsOnPdf']+1
    #                 if 'annotated material pdf Note annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['comment'][
    #                         'noteTypeCommentsOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['comment']['noteTypeCommentsOnPdf']+1

    #             #####################################    Ends PDF Annotations     #############################################################

    #             # Video Annotations
    #             # Total Video Annotations
    #             #  Annotation material activity: [username annotated material material_type annotation_type annotation_tool timestamp]
    #             elif 'annotated material video' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                 listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video'][
    #                     'totalVideoAnnotations'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['totalVideoAnnotations']+1

    #                 # Video Annotation Tools (draw, pinpoint) Usage
    #                 if 'pinpoint' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationTools'][
    #                         'pinpointToolOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationTools']['pinpointToolOnVid']+1
    #                 if 'draw' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationTools'][
    #                         'drawToolOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationTools']['drawToolOnVid']+1
                    
    #                 # Annotation Types (Note, Question, External Resource) and if they are comments (no tool used)
                    
    #                 if 'annotated material video Question' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise'][
    #                         'questionTypeAnnotationsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['questionTypeAnnotationsOnVid']+1
    #                     # If annotation is question type COMMENT
    #                     if 'annotated material video Question annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment'][
    #                         'questionTypeCommentsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment']['questionTypeCommentsOnVid']+1
                    
    #                 if 'annotated material video Note' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise'][
    #                         'noteTypeAnnotationsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['noteTypeAnnotationsOnVid']+1
    #                 # If annotation is note type COMMENT
    #                     if 'annotated material video Note annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment'][
    #                         'noteTypeCommentsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment']['noteTypeCommentsOnVid']+1
                    
    #                 if 'annotated material video External Resource' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise'][
    #                         'externalResourceTypeAnnotationsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['externalResourceTypeAnnotationsOnVid']+1
    #                     # If annotation is external resource type COMMENT
    #                     if 'annotated material video External Resource annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment'][
    #                         'externalResourceTypeCommentsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment']['externalResourceTypeCommentsOnVid']+1
                    
    #                 # Added this commented section in the upper nested conditions
    #                 """  # Comments and types (Annotations without using tool)
    #                 if 'annotated material video External Resource annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment'][
    #                         'externalResourceTypeCommentsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment']['externalResourceTypeCommentsOnVid']+1

    #                 if 'annotated material video Question annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment'][
    #                         'questionTypeCommentsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment']['questionTypeCommentsOnVid']+1

    #                 if 'annotated material video Note annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment'][
    #                         'noteTypeCommentsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment']['noteTypeCommentsOnVid']+1 """

            
    #         # Count Total likes on annotations, comments and replies
    #         elif 'liked' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #             splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')
    #             if  splittedThisActivityStringArray[1] == 'liked':
    #                 if splittedThisActivityStringArray[2]=='annotation':
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations']+1
    #                     if splittedThisActivityStringArray[3] == 'Note':
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnNoteTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnNoteTypeAnnotations']+1
    #                         if splittedThisActivityStringArray[4] == 'annotation':
    #                             listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnNoteTypeComments']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnNoteTypeComments']+1
    #                     elif splittedThisActivityStringArray[3] == 'Question':
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnQuestionTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnQuestionTypeAnnotations']+1
    #                         if splittedThisActivityStringArray[4] == 'annotation':
    #                             listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnQuestionTypeComments']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnQuestionTypeComments']+1
    #                     elif splittedThisActivityStringArray[3] == 'External Resource':
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnExternalResourceTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnExternalResourceTypeAnnotations']+1
    #                         if splittedThisActivityStringArray[4] == 'annotation':
    #                             listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnExternalResourceTypeComments']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnExternalResourceTypeComments']+1
    #                 elif splittedThisActivityStringArray[2]=='reply':
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnRepliesOfAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnRepliesOfAnnotations']+1
            
            
    #         # Count the unlikes on annotations, comments, replies to subtract from the likes    
    #         elif 'unliked' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #             splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')
    #             if  splittedThisActivityStringArray[1] == 'unliked':
    #                 if splittedThisActivityStringArray[2]=='annotation':
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations']-1
    #                     if splittedThisActivityStringArray[3] == 'Note':
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnNoteTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnNoteTypeAnnotations']-1
    #                         if splittedThisActivityStringArray[4] == 'annotation':
    #                             listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnNoteTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnNoteTypeAnnotations']-1
    #                     elif splittedThisActivityStringArray[3] == 'Question':
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnQuestionTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnQuestionTypeAnnotations']-1
    #                         if splittedThisActivityStringArray[4] == 'annotation':
    #                             listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnQuestionTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnQuestionTypeAnnotations']-1
    #                     elif splittedThisActivityStringArray[3] == 'External Resource':
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnExternalResourceTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnExternalResourceTypeAnnotations']-1
    #                         if splittedThisActivityStringArray[4] == 'annotation':
    #                             listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnExternalResourceTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnExternalResourceTypeAnnotations']-1
    #                 elif splittedThisActivityStringArray[2]=='reply':
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnRepliesOfAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnRepliesOfAnnotations']-1

    #         # Count dislikes on annotations, comments and replies
    #         elif 'disliked' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #             splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')
    #             if  splittedThisActivityStringArray[1] == 'disliked':
    #                 if splittedThisActivityStringArray[2]=='annotation':
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations']+1
    #                     if splittedThisActivityStringArray[3] == 'Note':
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']+1
    #                         if splittedThisActivityStringArray[4] == 'annotation':
    #                             listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']+1
    #                     elif splittedThisActivityStringArray[3] == 'Question':
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']+1
    #                         if splittedThisActivityStringArray[4] == 'annotation':
    #                             listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']+1
    #                     elif splittedThisActivityStringArray[3] == 'External Resource':
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']+1
    #                         if splittedThisActivityStringArray[4] == 'annotation':
    #                             listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']+1
    #                 elif splittedThisActivityStringArray[2]=='reply':
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnRepliesOfAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnRepliesOfAnnotations']+1
            
    #         # Count the un-dislikes to subtract from the dislikes
    #         elif 'un-disliked' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #             splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')
    #             if  splittedThisActivityStringArray[1] == 'un-disliked':
    #                 if splittedThisActivityStringArray[2]=='annotation':
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations']-1
    #                     if splittedThisActivityStringArray[3] == 'Note':
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']-1
    #                         if splittedThisActivityStringArray[4] == 'annotation':
    #                             listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']-1
    #                     elif splittedThisActivityStringArray[3] == 'Question':
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']-1
    #                         if splittedThisActivityStringArray[4] == 'annotation':
    #                             listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']-1
    #                     elif splittedThisActivityStringArray[3] == 'External Resource':
    #                         listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']-1
    #                         if splittedThisActivityStringArray[4] == 'annotation':
    #                             listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']-1
    #                 elif splittedThisActivityStringArray[2]=='reply':
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnRepliesOfAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnRepliesOfAnnotations']-1

    #         # Count the accesses for course, channel, material [username accessed material material_type timestamp]
    #         elif 'accessed' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #             listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['totalAccesses'] =listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['totalAccesses']+1
    #             splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')
    #             if splittedThisActivityStringArray[2] == 'course':
    #                 listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['courseAccesses']=listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['courseAccesses']+1
    #             elif splittedThisActivityStringArray[2] == 'topic':
    #                 listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['topicAccesses']=listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['topicAccesses']+1
    #             elif splittedThisActivityStringArray[2] == 'channel':
    #                 listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['channelAccesses']=listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['channelAccesses']+1
    #             elif splittedThisActivityStringArray[2] == 'material':
    #                 if splittedThisActivityStringArray[3]== 'pdf':
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['materialAccesses']['pdfAccess']=listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['materialAccesses']['pdfAccess']+1
    #                 elif splittedThisActivityStringArray[3]== 'video':
    #                     listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['materialAccesses']['videoAccess']=listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['materialAccesses']['videoAccess']+1

    #         # PDFs completed
    #         elif 'completed pdf' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #             listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['pdf'][
    #                 'pdfCompleted'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['pdf']['pdfCompleted']+1
            
    #         # Videos completed
    #         elif 'completed video' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #             listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video'][
    #                 'videosCompleted'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video']['videosCompleted']+1
                

    #         # Viewed slide [username viewed slide slide_number timestamp]
    #         elif 'viewed slide' in studentActivitiesListAggregated[listIndex][itemIndex]:
    #             listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['pdf']['slidesViewed']=listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['pdf']['slidesViewed']+1

    #             splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')
    #             if splittedThisActivityStringArray[3]=='1':
    #                 listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['pdf']['pdfStarted']=listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['pdf']['pdfStarted']+1

    #         ####### Timestamps questions
    #         # Timestamps for videos watched 

    #         # Played/Paused Videos [username played/paused video video_id duration(seconds) timestamp]
    #         elif 'played video' in studentActivitiesListAggregated[listIndex][itemIndex] or 'paused video' in studentActivitiesListAggregated[listIndex][itemIndex]:
                
    #             splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')

    #             if 'played' == splittedThisActivityStringArray[1]:
    #                 startedVideosIDList.append(splittedThisActivityStringArray[3])
    #                 playedTimeInSeconds = playedTimeInSeconds+int(splittedThisActivityStringArray[4])
    #             if 'paused' == splittedThisActivityStringArray[1]:
    #                 pausedTimeInSeconds = pausedTimeInSeconds+int(splittedThisActivityStringArray[4])



    #             # add only the video id in the list of videos played or paused
    #             # Not using this commented code for time spent on videos
    #             #############################################################
    #             '''for i in range(len(allVideos)): 
    #                     # If video id is new in the list, create new object of video
    #                     if(allVideos[i]['videoId'] != splittedThisActivityStringArray[3]):
    #                         allVideos.append(copy.deepcopy(video))
    #                         allVideos[i]['videoId']= splittedThisActivityStringArray[3]
    #                         if('played' in splittedThisActivityStringArray[1]):
    #                             allVideos[i]['playedDurations']=allVideos[i]['playedDurations']+int(splittedThisActivityStringArray[4])
    #                         elif('paused' in splittedThisActivityStringArray[1]):
    #                             allVideos[i]['pausedDurations']=allVideos[i]['pausedDurations']+int(splittedThisActivityStringArray[4])   
    #                     # If video id is already in the list
    #                     elif(allVideos[i]['videoId'] == splittedThisActivityStringArray[3]): 
    #                         if('played' in splittedThisActivityStringArray[1]):
    #                             allVideos[i]['playedDurations']=allVideos[i]['playedDurations']+int(splittedThisActivityStringArray[4])
    #                         elif('paused' in splittedThisActivityStringArray[1]):
    #                             allVideos[i]['pausedDurations']=allVideos[i]['pausedDurations']+int(splittedThisActivityStringArray[4]) '''
    #             # Subtracting played duration from paused duration to find the total time spent in allVideos[i]
    #             ##########################################################################

    #             # Started videos
    #             if splittedThisActivityStringArray[4]=='0': # Meaning that the video is played from the beginning
    #                     startedVideosIDList.append(splittedThisActivityStringArray[3])
    #             # Pauses in videos
    #             elif('paused' in splittedThisActivityStringArray[1]):
    #                 listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video']['videosPauses']=listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video']['videosPauses']+1
                

    #     #Finding the unique IDs of videos started to count started videos
    #     listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video']['videosStarted']=len(set(startedVideosIDList))

    #     # Timespent on videos
    #     '''timeSpentonVideosInSeconds=0
    #     for i in range(len(allVideos)):
    #         timeSpentonVideosInSeconds=timeSpentonVideosInSeconds+(allVideos[i]['playedDurations']-allVideos[i]['pausedDurations'])
    #     listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video']['timeSpentOnVideos']=timeSpentonVideosInSeconds'''

    #     # Total time spent on videos
    #     listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video']['timeSpentOnVideos']=pausedTimeInSeconds-playedTimeInSeconds
   
    # return listOfStudentActivityDict2   
####dawar stop here 



# writing all the dictionaries created and populated in a json file
#writeToJsonFile(listOfStudentActivityDict)
# using created json file, generate the csv file from it
#
#convertToCsv.export_to_csv()


##########################################################################
# At this point, we have our list if dictionary ready to be clustered
##########################################################################


# Call the K-Means functions
# Call the Hierarchical clustering functions