
import pandas as pd
import pymongo
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import populateStudentProfiles as stdProfiling
import DataProcessing as dp
from config import Config

myclient = pymongo.MongoClient(Config.MONGO_DB_URI)
print(myclient)
print(Config.MONGO_DB_URI)
print(Config.MONGO_DB_NAME)
mydb = myclient[Config.MONGO_DB_NAME]

collection = mydb["activities"]
activities = collection.find({})
listOfStudentActivityDict = dp.processActivities(collection)
stdProfiling.createProfiles(listOfStudentActivityDict)

def exportStudentClusters():
    # Load the dataset
    df = pd.read_csv('activitiesProductionOrig.csv')  # Ensure this file path is correct

    # Select relevant features for clustering
    features = ['totalSessions', 'totalEnrollments', 'totalActivities', 
                'totalAnnotations', 'totalLikesOnAnnotations', 
                'totalAccesses', 'videosStarted', 'videosPauses', 
                'pdfStarted', 'pdfCompleted', 'slidesViewed']
    
    # Get unique course IDs
    unique_courses = df['course_id'].unique()

    # Create an empty list to collect all clustered data
    all_clusters = []

    # Loop through each course
    for course_id in unique_courses:
        # Filter students for this course
        course_df = df[df['course_id'] == course_id].copy()
        
        # If not enough students, skip clustering for this course
        if course_df.shape[0] < 3:
            print(f"Skipping course {course_id} due to insufficient data for clustering.")
            continue
        
        # Standardize the features
        scaler = StandardScaler()
        df_scaled = scaler.fit_transform(course_df[features])

        # Apply KMeans clustering
        kmeans = KMeans(n_clusters=3, random_state=42)
        course_df['cluster'] = kmeans.fit_predict(df_scaled)

        # Append the processed DataFrame to the list
        all_clusters.append(course_df)

    # Combine all processed DataFrames into one
    final_df = pd.concat(all_clusters, ignore_index=True)

    # Select only relevant columns
    columns_to_export = ['stdUsername', 'course_id', 'totalSessions', 'totalEnrollments', 'totalActivities', 
                         'totalAnnotations', 'totalLikesOnAnnotations', 'totalAccesses', 
                         'videosStarted', 'videosPauses', 'pdfStarted', 'pdfCompleted', 
                         'slidesViewed', 'cluster']
    
    # Save everything in **one** CSV file
    final_df[columns_to_export].to_csv('student_clusters_all_courses.csv', index=False)

    print(f"Exported 'student_clusters_all_courses.csv' with {len(final_df)} students.")

exportStudentClusters()