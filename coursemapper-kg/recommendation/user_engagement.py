
import pandas as pd
import pymongo
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import populateStudentProfiles as stdProfiling
import DataProcessing as dp
from config import Config
from neo4j import GraphDatabase

# Neo4j configuration (adjust these values as needed)
NEO4J_URI = Config.NEO4J_URI
NEO4J_USER = Config.NEO4J_USER
NEO4J_PASSWORD = Config.NEO4J_PASSWORD

myclient = pymongo.MongoClient(Config.MONGO_DB_URI)
print(myclient)
print(Config.MONGO_DB_URI)
print(Config.MONGO_DB_NAME)
mydb = myclient[Config.MONGO_DB_NAME]

collection = mydb["activities"]
activities = collection.find({})
listOfStudentActivityDict = dp.processActivities(mydb)
stdProfiling.createProfiles(listOfStudentActivityDict)

# Define mapping from cluster label to engagement level
cluster_to_engagement = {0: "low", 2: "medium", 1: "high"}


def exportStudentClusters():
    # Load the dataset
    df = pd.read_csv('activitiesProductionOrig.csv')  # Ensure this file path is correct
    
    # Select relevant features for clustering
    features = [ 'totalActivities', 'totalAddedAnnotations','totalAnnotationsReplied' , 'totalAnnotationsFollowed' ,'totalLikesOnAnnotations', 'totalDislikesOnAnnotations',
             'totalAccesses', 'totalDashboardAccesses', 'totalUserMentionedRepliedActivities', 'videosStarted','videosCompleted', 'videosPauses', 'timeSpentOnVideos', 'pdfStarted', 'pdfCompleted', 'slidesViewed', 'slidesNotUnderstood', 'totalAddedTags','totalTagViewed', "totalKnowledgeGraphAccesses",
             "totalKnowledgeGraphConcept/WikiViewed", "totalRecommendedConcept/WikiViewed", "totalRecommendedMaterialViewed", "totalSlideKnowledgeGraphMarkedUnderstood", "totalSlideKnowledgeGraphMarkedNotUnderstood", "totalSlideKnowledgeGraphMarkedAsNew", "recommendedConceptsMarkedUnderstood",
             "recommendedConceptsMarkedNotUnderstood", "recommendedConceptsMarkedMarkedAsNew", "totalRecommendedMaterialMarkedHelpful", "totalRecommendedMaterialMarkedNotHelpful"
             ]
    
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
        composite_scores = course_df.groupby('cluster')[features].mean().sum(axis=1)
         # Sort clusters by composite score: lowest composite -> low engagement, highest -> high engagement.
        sorted_clusters = composite_scores.sort_values().index.tolist()
    
        # Create mapping dynamically: assign "low", "medium", "high" based on sorted order.
        mapping = {cluster: level for cluster, level in zip(sorted_clusters, ["low", "medium", "high"])}
        # Append the processed DataFrame to the list
        course_df['engagement_level'] = course_df['cluster'].map(mapping)

        all_clusters.append(course_df)

    # Combine all processed DataFrames into one
    final_df = pd.concat(all_clusters, ignore_index=True)

     # Map each cluster to an engagement level
    ###final_df['engagement_level'] = final_df['cluster'].map(cluster_to_engagement)

    # Select only relevant columns
    columns_to_export = ['stdUsername', 'course_id',  'totalActivities', 'totalAddedAnnotations','totalAnnotationsReplied' , 'totalAnnotationsFollowed' ,'totalLikesOnAnnotations', 'totalDislikesOnAnnotations',
             'totalAccesses', 'totalDashboardAccesses', 'totalUserMentionedRepliedActivities', 'videosStarted','videosCompleted', 'videosPauses', 'timeSpentOnVideos', 'pdfStarted', 'pdfCompleted', 'slidesViewed', 'slidesNotUnderstood', 'totalAddedTags','totalTagViewed', "totalKnowledgeGraphAccesses",
             "totalKnowledgeGraphConcept/WikiViewed", "totalRecommendedConcept/WikiViewed", "totalRecommendedMaterialViewed", "totalSlideKnowledgeGraphMarkedUnderstood", "totalSlideKnowledgeGraphMarkedNotUnderstood", "totalSlideKnowledgeGraphMarkedAsNew", "recommendedConceptsMarkedUnderstood",
             "recommendedConceptsMarkedNotUnderstood", "recommendedConceptsMarkedMarkedAsNew", "totalRecommendedMaterialMarkedHelpful", "totalRecommendedMaterialMarkedNotHelpful", 'cluster', 'engagement_level']
    
    # Save everything in **one** CSV file
    final_df[columns_to_export].to_csv('student_clusters_all_courses.csv', index=False)

    print(f"Exported 'student_clusters_all_courses.csv' with {len(final_df)} students.")
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    for _, row in final_df.iterrows():
        user_id = row['stdUsername']
        course_id = row['course_id']
        new_level = row['engagement_level']
        try:
            update_engagement_status(driver, user_id, course_id, new_level)
            print(f"Updated user {user_id} for course {course_id} to engagement level: {new_level}")
        except Exception as e:
            print(f"Failed to update user {user_id} for course {course_id}: {e}")
    
    driver.close()

def update_engagement_status(driver, user_id, course_id, new_level):
    """
    Update the engagement level for a given user-course relationship in Neo4j.
    """
    with driver.session() as session:
        session.write_transaction(
            lambda tx: tx.run(
                """
                MATCH (u:User {uid: $userId})-[r:ENGAGED_IN]->(c:Course {cid: $courseId})
                SET r.level = $newLevel, r.timestamp = timestamp()
                RETURN u, c, r
                """,
                userId=user_id, courseId=course_id, newLevel=new_level
            )
        )

exportStudentClusters()