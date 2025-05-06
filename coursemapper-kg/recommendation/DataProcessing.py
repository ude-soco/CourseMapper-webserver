
from datetime import datetime
import copy
from collections import defaultdict

listOfStudentActivityDict2 = []

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
        'access': { #ok
            'totalAccesses': 0000,
            'courseAccesses': 0000,
            'topicAccesses': 0000,
            'channelAccesses': 0000,
            'materialAccesses': {
                'pdfAccess': 0000,  
                'videoAccess': 0000
            }
        },
        'dashboardAccess': { #ok
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
            "knowledgeGraphAccesses": { #ok
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
                    "totalRecommendedConcept/WikiViewed": 0000,
                    "totalRecommendedConceptViewed": 0000,
                    "totalRecommendedWikiArticleViewed": 0000,
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
   
 
    # aggregate activities per student
    aggr_activities_list = list(aggr_activities)


    for i in aggr_activities_list:
        
        user_id = i['_id']
 
        for j in range(len(i['activities'])):
            activity = i['activities'][j]
            verb_display = activity['verb']['display']['en-US']
            object_type = activity['object']['definition']['type'].rsplit('/', 1)[-1]
            timestamp = str(activity['timestamp'])
 
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
 
            elif ('added' in f"{verb_display} {object_type}" or 'asked' in f"{verb_display} {object_type}") and not ('tag' in f"{verb_display} {object_type}"):
     
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
                          
                            if splittedThisActivityStringArray[4]  == 'course-kg-main-concept':
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConcept/WikiViewed'] += 1
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphWikiArticleViewed'] += 1
 
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["courseKnowledgeGraph"]['totalCourseKnowledgeGraphConcept/WikiViewed'] += 1
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["courseKnowledgeGraph"]['totalCourseKnowledgeGraphWikiArticleViewed'] += 1
                           
                            elif splittedThisActivityStringArray[4]  == 'material-kg-main-concept'  or splittedThisActivityStringArray[4]  == 'material-kg-related-concept' or splittedThisActivityStringArray[4]  == 'material-kg-category':
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConcept/WikiViewed'] += 1
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphWikiArticleViewed'] += 1
 
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["materialKnowledgeGraphConceptViewed"]['totalMaterialKnowledgeGraphConcept/WikiViewed'] += 1
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["materialKnowledgeGraphConceptViewed"]['totalMaterialKnowledgeGraphWikiArticleViewed'] += 1
 
                            elif splittedThisActivityStringArray[4]  == 'slide-kg-main-concept' or splittedThisActivityStringArray[4]  == 'slide-kg-related-concept':
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphConcept/WikiViewed'] += 1
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']['totalKnowledgeGraphWikiArticleViewed'] += 1
 
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["slideKnowledgeGraphViewed"]['totalSlideKnowledgeGraphConcept/WikiViewed'] += 1
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["slideKnowledgeGraphViewed"]['totalSlideKnowledgeGraphWikiArticleViewed'] += 1
                            
                            elif splittedThisActivityStringArray[4]  == 'slide-kg-recommended-concept':
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["slideKnowledgeGraphViewed"]['totalRecommendedConcept/WikiViewed'] += 1
                                listOfStudentActivityDict2[index]['activitiesProfile']['knowledgeGraph']['knowledgeGraphViewed']["slideKnowledgeGraphViewed"]['totalRecommendedWikiArticleViewed'] += 1
 
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
    