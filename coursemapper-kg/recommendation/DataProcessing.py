
from datetime import datetime
import copy
from collections import defaultdict

statements = []
#activities = collection.find({})
# List of dictionaries (studentActivitiesDict JSON) for each student engagement record. Length = No of unique students
listOfStudentActivityDict = []
listOfStudentActivityDict2 = []
studentActivitiesDict = {
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
studentActivitiesDict2 = {
    'stdProfile': {
        'stdId': 0000,
        'stdUsername': "",
        'course_id': "",
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

""" def writeToJsonFile(data, filename='studentsActivities1.json'):
    with open(filename,"w") as f:
        json.dump(data,f,indent=2)
 """

def processActivities(collection):
    activities = collection.find({})
    for document in activities:  # Get the xApi statements containing SOV from activities collection
        # print(document)
        
        statements.append(document['statement'])
        
    possible_paths = [
        'http://www.CourseMapper.de/extensions/topic',
        'http://www.CourseMapper.de/extensions/channel',
        'http://www.CourseMapper.de/extensions/material',
        'http://www.CourseMapper.de/extensions/annotation',
        "http://localhost:4200/extensions/course"
    ]
    user_course_activities = defaultdict(lambda: defaultdict(list))
    
   # activities = collection.find({})
    for document in activities:
        extensions = document.get('statement', {}).get('object', {}).get('definition', {}).get('extensions', {})
        
        # Find the course_id from any of the possible paths
        course_id = None
          
        for path in possible_paths:
            if path in extensions:
                # Check if 'course_id' exists, otherwise fall back to 'id'
                course_id = extensions[path].get('course_id') or extensions[path].get('id')
                if course_id:  # If a valid course_id or id is found, stop the loop
                    break
        
        # Print or process the course_id
        if course_id:
            print(f"Course ID: {course_id}")
        else:
            print("Course ID: None")
        

    aggr_activities = collection.aggregate([
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
                        'totalActivities': '$sum'
                    }
                }
            }
        },  # -1 to sort by latest to oldest
        {
            "$sort": {'statement.timestamp': 1}
        }
])



    #for i in aggr_activities:
    #   print(i)

    # Counts the number of lists created: Should be equal to number of students (Objects) returned from aggregation
    listCount = 0
    # List of lists (containing all activities for each students)
    studentActivitiesListAggregated = []

    video = {
        'videoId':00,
        'playedDurations':00,
        'pausedDurations':00
    }
    #allVideos=[video]
    #startedVideosIDList = []

    aggr_activities_list = list(aggr_activities)

    for i in aggr_activities_list:  # Loop through aggregated activities
        studentActivitiesListAggregated.append([])
        listOfStudentActivityDict.append(copy.deepcopy(studentActivitiesDict))

        for j in range(len(i['activities'])):
            activity = i['activities'][j]
            verb_display = activity['verb']['display']['en-US']
            object_type = activity['object']['definition']['type'].rsplit('/', 1)[-1]
            timestamp = str(activity['timestamp'])

            # Extract course_id from multiple possible paths
            course_id = None
            extensions = activity['object']['definition'].get('extensions', {})
              
            for path in possible_paths:
                if path in extensions:
                    # Check if 'course_id' exists, otherwise fall back to 'id'
                    course_id = extensions[path].get('course_id') or extensions[path].get('id')
                    if course_id:  # If a valid course_id or id is found, stop the loop
                        break

            # Construct the log entry with course_id
            entry = f"{i['_id']} {verb_display} {object_type} {course_id if course_id else 'None'} {timestamp}"

            # Determine activity type
            if 'annotated material' in f"{verb_display} {object_type}":
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"
                entry += f" {activity['result']['extensions']['http://www.CourseMapper.de/extensions/annotation']['type']}"
                entry += f" {activity['result']['extensions']['http://www.CourseMapper.de/extensions/annotation']['tool']['type']}"
            
            elif 'accessed material' in f"{verb_display} {object_type}":
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"
            
            elif 'completed' in verb_display:
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"

            elif 'played video' == f"{verb_display} {object_type}":
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('timestamp', 'None')}"

            elif 'paused video' == f"{verb_display} {object_type}":
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('timestamp', 'None')}"

            elif 'viewed slide' == f"{verb_display} {object_type}":
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('pageNr', 'None')}"

            #print(studentActivitiesListAggregated[listCount])
            studentActivitiesListAggregated[listCount].append(entry)
        listCount = listCount+1
    #   print(i)
    
    print(studentActivitiesListAggregated[2])

    for i in aggr_activities_list:  # Loop through aggregated activities
        user_id = i['_id']  # Extract user ID
    

        for j in range(len(i['activities'])):
            activity = i['activities'][j]
            verb_display = activity['verb']['display']['en-US']
            object_type = activity['object']['definition']['type'].rsplit('/', 1)[-1]
            timestamp = str(activity['timestamp'])

            # Extract course_id from multiple possible paths
            course_id = None
            extensions = activity['object']['definition'].get('extensions', {})
        
            for path in possible_paths:
                if path in extensions:
                    # Check if 'course_id' exists, otherwise fall back to 'id'
                    course_id = extensions[path].get('course_id') or extensions[path].get('id')
                    if course_id:  # If a valid course_id or id is found, stop the loop
                        break
            # Default to 'None' if no course_id is found
            if not course_id:
                continue

            # default value
            entry = f"{user_id} {verb_display} {object_type} {timestamp}"
            
            # Determine activity type
            if 'annotated material' in f"{verb_display} {object_type}":
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"
                entry += f" {activity['result']['extensions']['http://www.CourseMapper.de/extensions/annotation']['type']}"
                entry += f" {activity['result']['extensions']['http://www.CourseMapper.de/extensions/annotation']['tool']['type']}"
            
            elif 'accessed material' in f"{verb_display} {object_type}":
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"
            
            elif 'completed' in verb_display:
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"

            elif 'played video' == f"{verb_display} {object_type}":
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('timestamp', 'None')}"

            elif 'paused video' == f"{verb_display} {object_type}":
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('type', 'None')}"
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('timestamp', 'None')}"

            elif 'viewed slide' == f"{verb_display} {object_type}":
                entry += f" {extensions.get('http://www.CourseMapper.de/extensions/material', {}).get('pageNr', 'None')}"


            # Store in the dictionary grouped by user_id and course_id
            user_course_activities[user_id][course_id].append(entry)

    # Convert defaultdict to a standard dictionary for output
    user_course_activities = {user: dict(courses) for user, courses in user_course_activities.items()}
    
    final_data = []

# Iterate over user IDs
    index = 0
    for user_id, courses in user_course_activities.items():
        for course_id, activities in courses.items():
            startedVideosIDList = []
            listOfStudentActivityDict2.append(copy.deepcopy(studentActivitiesDict2))
            # Initialize user-course statistics
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
                if 'logged in' in activity:
                    listOfStudentActivityDict2[index]['stdProfile'][
                        'totalSessions'] = listOfStudentActivityDict2[index]['stdProfile']['totalSessions']+1
                elif 'accessed' in activity:
                    listOfStudentActivityDict2[index]['activitiesProfile']['access']['totalAccesses'] +=1
                
                elif 'completed pdf' in activity:
                    listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['pdf'][
                    'pdfCompleted'] +=1

                elif 'enrolled course' in activity:
                    listOfStudentActivityDict2[index]['stdProfile'][
                    'totalEnrollments'] +=1
                elif 'annotated material' in activity:
                    listOfStudentActivityDict2[index]['activitiesProfile']['annotations']['totalAnnotations']+=1
                elif 'viewed slide' in activity:
                    listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['pdf']['slidesViewed']+=1
                
                    splittedThisActivityStringArray=  activity.split(' ')
                    if splittedThisActivityStringArray[3]=='1':

                        listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['pdf']['pdfStarted'] +=1
                
                elif 'liked' in activity:
                    splittedThisActivityStringArray=  activity.split(' ')
                    if  splittedThisActivityStringArray[1] == 'liked':
                        if splittedThisActivityStringArray[2]=='annotation':
                            listOfStudentActivityDict2[index]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations'] += 1
                elif 'played video' in activity or 'paused video' in activity:       
                    splittedThisActivityStringArray=  activity.split(' ')
                    if 'played' == splittedThisActivityStringArray[1]:
                        startedVideosIDList.append(splittedThisActivityStringArray[3])
                        playedTimeInSeconds = playedTimeInSeconds+int(splittedThisActivityStringArray[4])
                    if 'paused' == splittedThisActivityStringArray[1]:
                        pausedTimeInSeconds = pausedTimeInSeconds+int(splittedThisActivityStringArray[4])
                    if splittedThisActivityStringArray[4]=='0': # Meaning that the video is played from the beginning
                        startedVideosIDList.append(splittedThisActivityStringArray[3])
                # Pauses in videos
                    elif('paused' in splittedThisActivityStringArray[1]):
                        listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['video']['videosPauses'] +=1

            listOfStudentActivityDict2[index]['activitiesProfile']['materialProfile']['video']['videosStarted']=len(set(startedVideosIDList))
            
            index = index +1
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




    for listIndex in range(len(studentActivitiesListAggregated)):
        playedTimeInSeconds=0
        pausedTimeInSeconds=0
        allVideos=[video]
        startedVideosIDList = []
        listOfStudentActivityDict[listIndex]['stdProfile']['stdUsername'] = studentActivitiesListAggregated[listIndex][0].split(' ')[
            0]
        listOfStudentActivityDict[listIndex]['stdProfile']['stdId'] = listIndex+1
        for itemIndex in range(len(studentActivitiesListAggregated[listIndex])):

            # Total activities
            listOfStudentActivityDict[listIndex]['activitiesProfile']['totalActivities'] = len(
                studentActivitiesListAggregated[listIndex])

            # Count Total Enrollments
            if 'enrolled course' in studentActivitiesListAggregated[listIndex][itemIndex]:
                listOfStudentActivityDict[listIndex]['stdProfile'][
                    'totalEnrollments'] = listOfStudentActivityDict[listIndex]['stdProfile']['totalEnrollments']+1

            # Max session time
            # Min session time
            # Avg session time
            # Total Number of Sessions
            elif 'logged in' in studentActivitiesListAggregated[listIndex][itemIndex]:
                    listOfStudentActivityDict[listIndex]['stdProfile'][
                    'totalSessions'] = listOfStudentActivityDict[listIndex]['stdProfile']['totalSessions']+1


            # Annotations

            # Total Annotations
            elif 'annotated material' in studentActivitiesListAggregated[listIndex][itemIndex]:
                listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations'][
                    'totalAnnotations'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['totalAnnotations']+1

                # Total PDF Annotations
                if 'annotated material pdf' in studentActivitiesListAggregated[listIndex][itemIndex]:
                    listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf'][
                        'totalPdfAnnotations'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['totalPdfAnnotations']+1

                    # PDF Annotation Tools (draw, pinpoint, highlight)
                    if 'highlight' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationTools'][
                            'highlightToolOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationTools']['highlightToolOnPdf']+1
                    if 'pinpoint' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationTools'][
                            'pinpointToolOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationTools']['pinpointToolOnPdf']+1
                    if 'draw' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationTools'][
                            'drawToolOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationTools']['drawToolOnPdf']+1

                    # Annotation Types (Note, Question, External Resource)
                    if 'annotated material pdf Question' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise'][
                            'questionTypeAnnotationsOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['questionTypeAnnotationsOnPdf']+1
                    if 'annotated material pdf Note' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise'][
                            'noteTypeAnnotationsOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['noteTypeAnnotationsOnPdf']+1
                    if 'annotated material pdf External Resource' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise'][
                            'externalResourceTypeAnnotationsOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['externalResourceTypeAnnotationsOnPdf']+1

                    # Comments and types (Annotations without using tool)
                    if 'annotated material pdf External Resource annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['comment'][
                            'externalResourceTypeCommentsOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['comment']['externalResourceTypeCommentsOnPdf']+1
                    if 'annotated material pdf Question annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['comment'][
                            'questionTypeCommentsOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['comment']['questionTypeCommentsOnPdf']+1
                    if 'annotated material pdf Note annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['comment'][
                            'noteTypeCommentsOnPdf'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['pdf']['annotationCountTypewise']['comment']['noteTypeCommentsOnPdf']+1

                #####################################    Ends PDF Annotations     #############################################################

                # Video Annotations
                # Total Video Annotations
                #  Annotation material activity: [username annotated material material_type annotation_type annotation_tool timestamp]
                elif 'annotated material video' in studentActivitiesListAggregated[listIndex][itemIndex]:
                    listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video'][
                        'totalVideoAnnotations'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['totalVideoAnnotations']+1

                    # Video Annotation Tools (draw, pinpoint) Usage
                    if 'pinpoint' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationTools'][
                            'pinpointToolOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationTools']['pinpointToolOnVid']+1
                    if 'draw' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationTools'][
                            'drawToolOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationTools']['drawToolOnVid']+1
                    
                    # Annotation Types (Note, Question, External Resource) and if they are comments (no tool used)
                    
                    if 'annotated material video Question' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise'][
                            'questionTypeAnnotationsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['questionTypeAnnotationsOnVid']+1
                        # If annotation is question type COMMENT
                        if 'annotated material video Question annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment'][
                            'questionTypeCommentsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment']['questionTypeCommentsOnVid']+1
                    
                    if 'annotated material video Note' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise'][
                            'noteTypeAnnotationsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['noteTypeAnnotationsOnVid']+1
                    # If annotation is note type COMMENT
                        if 'annotated material video Note annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment'][
                            'noteTypeCommentsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment']['noteTypeCommentsOnVid']+1
                    
                    if 'annotated material video External Resource' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise'][
                            'externalResourceTypeAnnotationsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['externalResourceTypeAnnotationsOnVid']+1
                        # If annotation is external resource type COMMENT
                        if 'annotated material video External Resource annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment'][
                            'externalResourceTypeCommentsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment']['externalResourceTypeCommentsOnVid']+1
                    
                    # Added this commented section in the upper nested conditions
                    """  # Comments and types (Annotations without using tool)
                    if 'annotated material video External Resource annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment'][
                            'externalResourceTypeCommentsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment']['externalResourceTypeCommentsOnVid']+1

                    if 'annotated material video Question annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment'][
                            'questionTypeCommentsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment']['questionTypeCommentsOnVid']+1

                    if 'annotated material video Note annotation' in studentActivitiesListAggregated[listIndex][itemIndex]:
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment'][
                            'noteTypeCommentsOnVid'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['annotations']['video']['annotationCountTypewise']['comment']['noteTypeCommentsOnVid']+1 """

            
            # Count Total likes on annotations, comments and replies
            elif 'liked' in studentActivitiesListAggregated[listIndex][itemIndex]:
                splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')
                if  splittedThisActivityStringArray[1] == 'liked':
                    if splittedThisActivityStringArray[2]=='annotation':
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations']+1
                        if splittedThisActivityStringArray[3] == 'Note':
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnNoteTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnNoteTypeAnnotations']+1
                            if splittedThisActivityStringArray[4] == 'annotation':
                                listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnNoteTypeComments']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnNoteTypeComments']+1
                        elif splittedThisActivityStringArray[3] == 'Question':
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnQuestionTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnQuestionTypeAnnotations']+1
                            if splittedThisActivityStringArray[4] == 'annotation':
                                listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnQuestionTypeComments']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnQuestionTypeComments']+1
                        elif splittedThisActivityStringArray[3] == 'External Resource':
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnExternalResourceTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnExternalResourceTypeAnnotations']+1
                            if splittedThisActivityStringArray[4] == 'annotation':
                                listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnExternalResourceTypeComments']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnExternalResourceTypeComments']+1
                    elif splittedThisActivityStringArray[2]=='reply':
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnRepliesOfAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnRepliesOfAnnotations']+1
            
            
            # Count the unlikes on annotations, comments, replies to subtract from the likes    
            elif 'unliked' in studentActivitiesListAggregated[listIndex][itemIndex]:
                splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')
                if  splittedThisActivityStringArray[1] == 'unliked':
                    if splittedThisActivityStringArray[2]=='annotation':
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['totalLikesOnAnnotations']-1
                        if splittedThisActivityStringArray[3] == 'Note':
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnNoteTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnNoteTypeAnnotations']-1
                            if splittedThisActivityStringArray[4] == 'annotation':
                                listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnNoteTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnNoteTypeAnnotations']-1
                        elif splittedThisActivityStringArray[3] == 'Question':
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnQuestionTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnQuestionTypeAnnotations']-1
                            if splittedThisActivityStringArray[4] == 'annotation':
                                listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnQuestionTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnQuestionTypeAnnotations']-1
                        elif splittedThisActivityStringArray[3] == 'External Resource':
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnExternalResourceTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnAnnotations']['likesOnExternalResourceTypeAnnotations']-1
                            if splittedThisActivityStringArray[4] == 'annotation':
                                listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnExternalResourceTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnComments']['likesOnExternalResourceTypeAnnotations']-1
                    elif splittedThisActivityStringArray[2]=='reply':
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnRepliesOfAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['likes']['likesOnRepliesOfAnnotations']-1

            # Count dislikes on annotations, comments and replies
            elif 'disliked' in studentActivitiesListAggregated[listIndex][itemIndex]:
                splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')
                if  splittedThisActivityStringArray[1] == 'disliked':
                    if splittedThisActivityStringArray[2]=='annotation':
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations']+1
                        if splittedThisActivityStringArray[3] == 'Note':
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']+1
                            if splittedThisActivityStringArray[4] == 'annotation':
                                listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']+1
                        elif splittedThisActivityStringArray[3] == 'Question':
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']+1
                            if splittedThisActivityStringArray[4] == 'annotation':
                                listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']+1
                        elif splittedThisActivityStringArray[3] == 'External Resource':
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']+1
                            if splittedThisActivityStringArray[4] == 'annotation':
                                listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']+1
                    elif splittedThisActivityStringArray[2]=='reply':
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnRepliesOfAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnRepliesOfAnnotations']+1
            
            # Count the un-dislikes to subtract from the dislikes
            elif 'un-disliked' in studentActivitiesListAggregated[listIndex][itemIndex]:
                splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')
                if  splittedThisActivityStringArray[1] == 'un-disliked':
                    if splittedThisActivityStringArray[2]=='annotation':
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['totalDislikesOnAnnotations']-1
                        if splittedThisActivityStringArray[3] == 'Note':
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']-1
                            if splittedThisActivityStringArray[4] == 'annotation':
                                listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnNoteTypeAnnotations']-1
                        elif splittedThisActivityStringArray[3] == 'Question':
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']-1
                            if splittedThisActivityStringArray[4] == 'annotation':
                                listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnQuestionTypeAnnotations']-1
                        elif splittedThisActivityStringArray[3] == 'External Resource':
                            listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']= listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']-1
                            if splittedThisActivityStringArray[4] == 'annotation':
                                listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnAnnotations']['dislikesOnExternalResourceTypeAnnotations']-1
                    elif splittedThisActivityStringArray[2]=='reply':
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnRepliesOfAnnotations']=listOfStudentActivityDict[listIndex]['activitiesProfile']['dislikes']['dislikesOnRepliesOfAnnotations']-1

            # Count the accesses for course, channel, material [username accessed material material_type timestamp]
            elif 'accessed' in studentActivitiesListAggregated[listIndex][itemIndex]:
                listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['totalAccesses'] =listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['totalAccesses']+1
                splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')
                if splittedThisActivityStringArray[2] == 'course':
                    listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['courseAccesses']=listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['courseAccesses']+1
                elif splittedThisActivityStringArray[2] == 'topic':
                    listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['topicAccesses']=listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['topicAccesses']+1
                elif splittedThisActivityStringArray[2] == 'channel':
                    listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['channelAccesses']=listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['channelAccesses']+1
                elif splittedThisActivityStringArray[2] == 'material':
                    if splittedThisActivityStringArray[3]== 'pdf':
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['materialAccesses']['pdfAccess']=listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['materialAccesses']['pdfAccess']+1
                    elif splittedThisActivityStringArray[3]== 'video':
                        listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['materialAccesses']['videoAccess']=listOfStudentActivityDict[listIndex]['activitiesProfile']['access']['materialAccesses']['videoAccess']+1

            # PDFs completed
            elif 'completed pdf' in studentActivitiesListAggregated[listIndex][itemIndex]:
                listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['pdf'][
                    'pdfCompleted'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['pdf']['pdfCompleted']+1
            
            # Videos completed
            elif 'completed video' in studentActivitiesListAggregated[listIndex][itemIndex]:
                listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video'][
                    'videosCompleted'] = listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video']['videosCompleted']+1
                

            # Viewed slide [username viewed slide slide_number timestamp]
            elif 'viewed slide' in studentActivitiesListAggregated[listIndex][itemIndex]:
                listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['pdf']['slidesViewed']=listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['pdf']['slidesViewed']+1

                splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')
                if splittedThisActivityStringArray[3]=='1':
                    listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['pdf']['pdfStarted']=listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['pdf']['pdfStarted']+1

            ####### Timestamps questions
            # Timestamps for videos watched 

            # Played/Paused Videos [username played/paused video video_id duration(seconds) timestamp]
            elif 'played video' in studentActivitiesListAggregated[listIndex][itemIndex] or 'paused video' in studentActivitiesListAggregated[listIndex][itemIndex]:
                
                splittedThisActivityStringArray=  studentActivitiesListAggregated[listIndex][itemIndex].split(' ')

                if 'played' == splittedThisActivityStringArray[1]:
                    startedVideosIDList.append(splittedThisActivityStringArray[3])
                    playedTimeInSeconds = playedTimeInSeconds+int(splittedThisActivityStringArray[4])
                if 'paused' == splittedThisActivityStringArray[1]:
                    pausedTimeInSeconds = pausedTimeInSeconds+int(splittedThisActivityStringArray[4])



                # add only the video id in the list of videos played or paused
                # Not using this commented code for time spent on videos
                #############################################################
                '''for i in range(len(allVideos)): 
                        # If video id is new in the list, create new object of video
                        if(allVideos[i]['videoId'] != splittedThisActivityStringArray[3]):
                            allVideos.append(copy.deepcopy(video))
                            allVideos[i]['videoId']= splittedThisActivityStringArray[3]
                            if('played' in splittedThisActivityStringArray[1]):
                                allVideos[i]['playedDurations']=allVideos[i]['playedDurations']+int(splittedThisActivityStringArray[4])
                            elif('paused' in splittedThisActivityStringArray[1]):
                                allVideos[i]['pausedDurations']=allVideos[i]['pausedDurations']+int(splittedThisActivityStringArray[4])   
                        # If video id is already in the list
                        elif(allVideos[i]['videoId'] == splittedThisActivityStringArray[3]): 
                            if('played' in splittedThisActivityStringArray[1]):
                                allVideos[i]['playedDurations']=allVideos[i]['playedDurations']+int(splittedThisActivityStringArray[4])
                            elif('paused' in splittedThisActivityStringArray[1]):
                                allVideos[i]['pausedDurations']=allVideos[i]['pausedDurations']+int(splittedThisActivityStringArray[4]) '''
                # Subtracting played duration from paused duration to find the total time spent in allVideos[i]
                ##########################################################################

                # Started videos
                if splittedThisActivityStringArray[4]=='0': # Meaning that the video is played from the beginning
                        startedVideosIDList.append(splittedThisActivityStringArray[3])
                # Pauses in videos
                elif('paused' in splittedThisActivityStringArray[1]):
                    listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video']['videosPauses']=listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video']['videosPauses']+1
                

        #Finding the unique IDs of videos started to count started videos
        listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video']['videosStarted']=len(set(startedVideosIDList))

        # Timespent on videos
        '''timeSpentonVideosInSeconds=0
        for i in range(len(allVideos)):
            timeSpentonVideosInSeconds=timeSpentonVideosInSeconds+(allVideos[i]['playedDurations']-allVideos[i]['pausedDurations'])
        listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video']['timeSpentOnVideos']=timeSpentonVideosInSeconds'''

        # Total time spent on videos
        listOfStudentActivityDict[listIndex]['activitiesProfile']['materialProfile']['video']['timeSpentOnVideos']=pausedTimeInSeconds-playedTimeInSeconds
   
    return listOfStudentActivityDict2    



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