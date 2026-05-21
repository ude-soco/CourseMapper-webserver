"""
Test script for relationship pipeline

Test:
    - DNU
    - Interest
    - Engagement
"""

# type this command to run this file:
# pipenv run python -m app.services.course_materials.Mooc_Recommendation.learner_model.test.test_relationship_info

from ...database_connection.MongoDB_connection import MongoDBConnection
from ...database_connection.CourseMapper_connection import CourseMapperConnection

from ..relationship_info import DNUInfo, InterestInfo, EngagementInfo


# real user id for testing
uid = "69acb9460e3a21f27e87122f"


def print_result(title, result):

    print("\n")
    print("===================================")
    print(title)
    print("===================================")

    if not result:
        print("No data found")
        return

    for cid, info in result.items():

        print("ConceptID:", cid)
        print("Relationship:", info["relationship"])
        print("weight:", info["weight"])
        print("timestamp:", info["timestamp"])
        print("position_weight:", info.get("position_weight"))
        print("position_time:", info.get("position_time"))

        emb = info.get("unupdated_embedding")

        if emb is not None:
            print("embedding_dim:", len(emb))

        print()

    print("Total:", len(result))


def test_relationships():

    # -----------------------------
    # connect database
    # -----------------------------
    coursemapper_db = CourseMapperConnection()
    mongodb_db = MongoDBConnection()

    # -----------------------------
    # DNU
    # -----------------------------
    dnu = DNUInfo(uid, coursemapper_db, mongodb_db)
    dnu_result = dnu.get_dnu_info()

    print_result("DNU RESULT", dnu_result)

    # -----------------------------
    # INTEREST
    # -----------------------------
    interest = InterestInfo(uid, coursemapper_db, mongodb_db)
    interest_result = interest.get_interest_info()

    print_result("INTEREST RESULT", interest_result)

    # -----------------------------
    # ENGAGEMENT
    # -----------------------------
    engagement = EngagementInfo(uid, coursemapper_db, mongodb_db)
    engagement_result = engagement.get_engagement_info()

    print_result("ENGAGEMENT RESULT", engagement_result)

    # -----------------------------
    # close connection
    # -----------------------------
    coursemapper_db.close()
    mongodb_db.close()


if __name__ == "__main__":
    test_relationships()