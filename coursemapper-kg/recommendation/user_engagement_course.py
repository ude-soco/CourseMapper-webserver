import pandas as pd
import pymongo
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
from config import Config
from bson import ObjectId

# MongoDB configuration
MONGO_DB_URI = "mongodb://localhost:27017"  # Replace with your MongoDB URI
MONGO_DB_NAME = "coursemapper_v2"           # Replace with your database name

# MongoDB connection
myclient = pymongo.MongoClient(Config.MONGO_DB_URI)
mydb = myclient[MONGO_DB_NAME]
collection = mydb["activities"]

def get_activities_by_course(course_id):
    """
    Retrieve all activities for a specific course_id from the MongoDB collection.
    """
    activities = collection.find({
        "$or": [
            {"statement.object.definition.extensions.http://localhost:4200/extensions/course.id": ObjectId(course_id)},
            {"statement.object.definition.extensions.http://www.CourseMapper.de/extensions/topic.course_id": ObjectId(course_id)},
            {"statement.object.definition.extensions.http://www.CourseMapper.de/extensions/channel.course_id": ObjectId(course_id)},
            {"statement.object.definition.extensions.http://www.CourseMapper.de/extensions/material.course_id": ObjectId(course_id)}
        ]
    })
    return activities

def process_course_activities(activities, course_id):
    """
    Aggregate student activities for the specified course.
    """
    student_metrics = {}

    for activity in activities:
        statement = activity.get("statement", {})
        actor = statement.get("actor", {}).get("name")
        if not actor:
            continue  # Skip if no actor
        
        verb_id = statement.get("verb", {}).get("id", "")
        extensions = statement.get("object", {}).get("definition", {}).get("extensions", {})
        material_type = statement.get("object", {}).get("definition", {}).get("type", "")

        # Verify course_id
        if not any(ext.get("course_id") == ObjectId(course_id) for ext in extensions.values()):
            continue
        
        # Initialize metrics
        if actor not in student_metrics:
            student_metrics[actor] = {
                "totalSessions": 0,
                "totalAccesses": 0,
                "videosStarted": 0,
                "pdfStarted": 0,
                "slidesViewed": 0,
            }

        # Update metrics based on verb and material type
        if "loggedin" in verb_id or "registered" in verb_id:
            student_metrics[actor]["totalSessions"] += 1
        if "access" in verb_id:
            student_metrics[actor]["totalAccesses"] += 1
        if material_type == "http://id.tincanapi.com/activitytype/video":
            student_metrics[actor]["videosStarted"] += 1
        if material_type == "http://id.tincanapi.com/activitytype/pdf":
            student_metrics[actor]["pdfStarted"] += 1
        if material_type == "http://id.tincanapi.com/activitytype/slide":
            student_metrics[actor]["slidesViewed"] += 1

    return student_metrics

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
    course_id = "673e19c9e098378056898237"  # Replace with your course ID

    # Step 1: Query Activities
    activities = get_activities_by_course(course_id)
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
