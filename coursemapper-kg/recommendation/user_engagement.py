
import pandas as pd
import pymongo
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans
import populateStudentProfiles as stdProfiling
import DataProcessing as dp
from config import Config
from neo4j import GraphDatabase
import json

# Neo4j configuration (adjust these values as needed)
NEO4J_URI = Config.NEO4J_URI
NEO4J_USER = Config.NEO4J_USER
NEO4J_PASSWORD = Config.NEO4J_PASSWORD

myclient = pymongo.MongoClient(Config.MONGO_DB_URI)
print(myclient)
print(Config.MONGO_DB_URI)
print(Config.MONGO_DB_NAME)
mydb = myclient[Config.MONGO_DB_NAME]


def exportStudentClusters():

    listOfStudentActivityDict = dp.processActivities(mydb)
    stdProfiling.createProfiles(listOfStudentActivityDict)
    # Load the dataset
    df = pd.read_csv('activitiesProductionOrig.csv')  # Ensure this file path is correct
    
    # Select relevant features for clustering

    
    features = [ 'totalActivities', 'totalAddedAnnotations','totalAnnotationsReplied' , 'totalAnnotationsFollowed' ,'totalLikesOnAnnotations', 'totalDislikesOnAnnotations',
             'totalAccesses', 'totalDashboardAccesses', 'totalUserMentionedRepliedActivities', 'videosStarted','videosCompleted', 'videosPauses', 'timeSpentOnVideos', 'pdfStarted', 'pdfCompleted', 'slidesViewed', 'slidesNotUnderstood', 'totalAddedTags','totalTagViewed', "totalKnowledgeGraphAccesses",
             "totalKnowledgeGraphConcept/WikiViewed", "totalRecommendedConcept/WikiViewed","totalRecommendedConceptViewedVisualExplanation","totalRecommendedConceptViewedTextualExplanation", "totalRecommendedMaterialViewed", "totalSlideKnowledgeGraphMarkedUnderstood", "totalSlideKnowledgeGraphMarkedNotUnderstood", "totalSlideKnowledgeGraphMarkedAsNew", "recommendedConceptsMarkedUnderstood",
             "recommendedConceptsMarkedNotUnderstood", "recommendedConceptsMarkedMarkedAsNew", "totalRecommendedMaterialMarkedHelpful", "totalRecommendedMaterialMarkedNotHelpful"
             ]
    
    # Get unique course IDs
    unique_courses = df['course_id'].unique()

    # Create an empty list to collect all clustered data
    all_clusters = []
    
    # Dictionary to store centroids for all courses
    all_centroids = {}

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

        # Log centroid values for each activity in each cluster
        print(f"--- Centroids for Course: {course_id} ---")
        cluster_means = course_df.groupby('cluster')[features].mean()
        
        # Store centroids for this course
        course_centroids = {}
        for cluster_idx, level in mapping.items():
            print(f"Engagement Level: {level} (Cluster {cluster_idx})")
            print(cluster_means.loc[cluster_idx])
            print("-" * 30)
            # Convert Series to dictionary and store
            course_centroids[level] = cluster_means.loc[cluster_idx].to_dict()
        
        all_centroids[str(course_id)] = course_centroids

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
    
    # Export centroids to JSON file for backend consumption
    centroids_file_path = 'cluster_centroids.json'
    with open(centroids_file_path, 'w') as f:
        json.dump(all_centroids, f, indent=2)
    print(f"Exported cluster centroids to '{centroids_file_path}'")
    
    # Build a set of (user_id, course_id) pairs where the user is a moderator
    # Moderators should not have ENGAGED_IN relationships with courses they moderate
    collection_roles = mydb["roles"]
    collection_courses = mydb["courses"]
    moderator_role_doc = collection_roles.find_one({"name": "moderator"})
    moderator_pairs = set()
    if moderator_role_doc:
        moderator_role_id = moderator_role_doc["_id"]
        for course in collection_courses.find({}):
            course_id_str = str(course["_id"])
            for user in course.get("users", []):
                if user.get("role") == moderator_role_id:
                    moderator_pairs.add((str(user["userId"]), course_id_str))
    print(f"Found {len(moderator_pairs)} moderator-course pairs to exclude from engagement updates")

    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
    
    for _, row in final_df.iterrows():
        user_id = row['stdUsername']
        course_id = row['course_id']
        new_level = row['engagement_level']

        # Skip moderators - they should not have engagement relationships with their own courses
        if (str(user_id), str(course_id)) in moderator_pairs:
            print(f"Skipping moderator {user_id} for course {course_id} (moderator-course pair excluded)")
            continue

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
        session.execute_write(
          lambda tx: tx.run(
                """
                MERGE (u:User {uid: $userId})
                MERGE (c:Course {cid: $courseId})
                MERGE (u)-[r:ENGAGED_IN]->(c)
                SET r.level = $newLevel, r.status = 'enrolled', r.timestamp = datetime()
                RETURN u, c, r
                """,
                userId=user_id, courseId=course_id, newLevel=new_level
            )
        )

exportStudentClusters()