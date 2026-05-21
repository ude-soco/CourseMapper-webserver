"""
Usage:
    pipenv run python -m app.services.course_materials.Mooc_Recommendation.test_mooc_recommendation

This is a simple test file for a single user uid.
Please replace TEST_UID with a real user uid before running.
"""

from .mooc_recommendation import (
    MoocRecommendationService,
    recommend_for_user,
    recommend_for_user_json,
)

# Replace this with a real uid from CourseMapper Neo4j before running.
TEST_UID = "69acb9460e3a21f27e87122f"
TOP_K = 20
PRINT_AS_JSON = False


if __name__ == "__main__":
    if TEST_UID == "PLEASE_REPLACE_WITH_REAL_UID":
        raise ValueError("Please replace TEST_UID with a real user uid before running this test.")

    if PRINT_AS_JSON:
        print(recommend_for_user_json(uid=TEST_UID, top_k=TOP_K))
    else:
        results = recommend_for_user(uid=TEST_UID, top_k=TOP_K)
        MoocRecommendationService.print_recommendations(TEST_UID, results)
