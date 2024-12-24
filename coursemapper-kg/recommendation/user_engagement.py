
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
    
    # Standardize the selected features for clustering
    scaler = StandardScaler()
    df_scaled = scaler.fit_transform(df[['totalSessions', 'totalEnrollments', 'totalActivities', 
                                         'totalAnnotations', 'totalLikesOnAnnotations', 
                                         'totalAccesses', 'videosStarted', 'videosPauses', 
                                         'pdfStarted', 'pdfCompleted', 'slidesViewed']])
    
    # Apply KMeans clustering
    kmeans = KMeans(n_clusters=3, random_state=42)
    df['clusters'] = kmeans.fit_predict(df_scaled)  # Add cluster labels to the DataFrame
    
    # Select only the columns to be exported
    columns_to_export = ['stdUsername', 'totalSessions', 'totalEnrollments', 'totalActivities', 
                         'totalAnnotations', 'totalLikesOnAnnotations', 'totalAccesses', 
                         'videosStarted', 'videosPauses', 'pdfStarted', 'pdfCompleted', 
                         'slidesViewed', 'clusters']
    
    # Export the DataFrame with selected columns
    df[columns_to_export].to_csv('student_clusters_with_selected_activities.csv', index=False)
    print(df['clusters'].value_counts())

    print("Exported 'student_clusters_with_selected_activities.csv' containing selected student activities and clusters.")


exportStudentClusters()