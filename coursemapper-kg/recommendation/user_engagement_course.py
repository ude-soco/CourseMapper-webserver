import pandas as pd
import pymongo
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from config import Config
from bson import ObjectId


import json
import JsonToCsvConversion as convertToCsv

# MongoDB configuration
MONGO_DB_URI = "mongodb://localhost:27017"  # Replace with your MongoDB URI
MONGO_DB_NAME = "coursemapper_v2"           # Replace with your database name

# MongoDB connection
myclient = pymongo.MongoClient(Config.MONGO_DB_URI)
mydb = myclient[MONGO_DB_NAME]
collection = mydb["activities"]
activities = collection.find({})

def processActivities(collection):
    aggr_activities = collection.aggregate([
    {
         "$project": {
            "_id": 0,
            "student": "$statement.actor.account.name",
            "course_id": {
                "$ifNull": ["$statement.object.definition.extensions.http://www.CourseMapper.de/extensions/material.course_id", "unknown"]
            },
            "verb": "$statement.verb.display.en-US",
            "type": "$statement.object.definition.type",
            "timestamp": "$statement.timestamp"
        }
    },
    {
        "$group": {
            "_id": {
                "student": "$student",
                "course": "$course_id"
            },
            "totalActivities": {"$sum": 1},
            "activities": {"$push": "$$ROOT"}
        }
    },
    {
        "$sort": {"_id.course": 1, "_id.student": 1}
    }
    ])

    course_profiles = []

    for group in aggr_activities:
        course_id = group["_id"]["course"]
        student = group["_id"]["student"]

        # Create a profile template
        profile = {
            "courseId": course_id,
            "stdProfile": {
                "stdUsername": student,
                "totalSessions": 0,
                "totalSessionTime": 0,
                "avgSessionTime": 0,
                "maxSessionTime": 0,
                "minSessionTime": 0,
                "totalEnrollments": 0
            },
            "activitiesProfile": {
                "totalActivities": group["totalActivities"],
                "access": {"totalAccesses": 0, "pdfAccess": 0, "videoAccess": 0},
                "annotations": {"totalAnnotations": 0},
                "materialProfile": {
                    "video": {"videosStarted": 0, "videosCompleted": 0},
                    "pdf": {"pdfStarted": 0, "pdfCompleted": 0}
                }
            }
        }

        # Process activities
        for activity in group["activities"]:
            verb = activity.get("verb", "")
            obj_type = activity.get("type", "")

            # Example: Handle material access
            if "accessed" in verb:
                profile["activitiesProfile"]["access"]["totalAccesses"] += 1
                if "pdf" in obj_type:
                    profile["activitiesProfile"]["access"]["pdfAccess"] += 1
                elif "video" in obj_type:
                    profile["activitiesProfile"]["access"]["videoAccess"] += 1

        # Add the profile to the list
        course_profiles.append(profile)


    return course_profiles

def extract_course_id(activity):
    try:
        return activity["statement"]["object"]["definition"]["extensions"]["http://www.CourseMapper.de/extensions/topic"]["course_id"]
    except KeyError:
        return "unknown"

def createProfiles(data, filename='courseSpecificProfiles.json'):
    with open(filename, "w") as f:
        json.dump(data, f, indent=2)
    convertToCsv.export_to_csv(filename)

listOfStudentActivityDict = processActivities(collection)
createProfiles(listOfStudentActivityDict)
'''

def prepare_clustering_data(student_metrics):
    """
    Convert aggregated student metrics to a DataFrame for clustering.
    """
    print("Student Metrics:", student_metrics)

    df = pd.DataFrame.from_dict(student_metrics, orient="index")
    df.reset_index(inplace=True)
    df.rename(columns={"index": "student"}, inplace=True)

    # Features for clustering
    features = ["totalSessions", "totalAccesses", "videosStarted", "pdfStarted", "slidesViewed"]
    df_scaled = StandardScaler().fit_transform(df[features])

    return df, df_scaled

def cluster_students(df, df_scaled, n_clusters=3):
    """
    Apply K-Means clustering to the student metrics.
    """
    kmeans = KMeans(n_clusters=n_clusters, random_state=42)
    df["cluster"] = kmeans.fit_predict(df_scaled)
    return df

def export_clustered_students(df, filename="clustered_students.csv"):
    """
    Export the clustered student data to a CSV file.
    """
    df.to_csv(filename, index=False)
    print(f"Clustered student data exported to {filename}")

def main():
   # course_id = "673e19c9e098378056898237"  # Replace with your course ID

    # Step 1: Query Activities
   # activities = get_activities_by_course(course_id)
    activities = list(activities)  # Ensure activities are iterable multiple times
    if not activities:
        print("No activities found for the specified course ID.")
        return

    # Step 2: Process Activities
    student_metrics = process_course_activities(activities, course_id)
    if not student_metrics:
        print("No data found for the specified course ID.")
        return

    # Step 3: Prepare Data
    df, df_scaled = prepare_clustering_data(student_metrics)

    # Step 4: Apply Clustering
    df_clustered = cluster_students(df, df_scaled, n_clusters=3)

    # Step 5: Export Results
    export_clustered_students(df_clustered, "clustered_students.csv")

if __name__ == "__main__":
    main()
'''