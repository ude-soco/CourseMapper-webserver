"""
Run:
    # Single user recommendation
    pipenv run python -m app.services.course_materials.Mooc_Recommendation.mooc_recommendation --uid <USER_UID>

    # Single user recommendation as JSON
    pipenv run python -m app.services.course_materials.Mooc_Recommendation.mooc_recommendation --uid <USER_UID> --as_json

This module generates Top-K course recommendations for one user by:
1. Reading the user's learner_model_embedding from CourseMapper Neo4j.
2. Reading all CourseMapper courses with course_embedding.
3. Reading all MOOC Central courses with course_embedding and platform info.
4. Computing cosine similarity between the user embedding and every course embedding.
5. Returning / printing the Top-K recommendation list.
"""

from __future__ import annotations

import argparse
import json
import math
from typing import Any, Dict, List, Optional

import numpy as np

from .database_connection.CourseMapper_connection import CourseMapperConnection
from .database_connection.MoocCentral_connection import MoocCentralConnection


class MoocRecommendationService:
    def __init__(self, coursemapper_db: CourseMapperConnection, mooccentral_db: MoocCentralConnection):
        self.coursemapper_db = coursemapper_db
        self.mooccentral_db = mooccentral_db

    @staticmethod
    def string_to_array(emb_str: Optional[str]) -> Optional[np.ndarray]:
        """Convert comma-separated embedding string into numpy array."""
        if emb_str is None:
            return None
        if isinstance(emb_str, np.ndarray):
            return emb_str

        emb_str = str(emb_str).strip()
        if not emb_str:
            return None

        try:
            return np.array([float(x.strip()) for x in emb_str.split(",") if x.strip() != ""], dtype=np.float32)
        except Exception:
            return None

    @staticmethod
    def cosine_similarity(vec_a: np.ndarray, vec_b: np.ndarray) -> float:
        """Compute cosine similarity safely."""
        if vec_a is None or vec_b is None:
            return -1.0
        if vec_a.shape != vec_b.shape:
            return -1.0

        norm_a = np.linalg.norm(vec_a)
        norm_b = np.linalg.norm(vec_b)
        if norm_a == 0 or norm_b == 0:
            return -1.0

        score = float(np.dot(vec_a, vec_b) / (norm_a * norm_b))
        if math.isnan(score):
            return -1.0
        return score

    def get_user_embedding(self, uid: str) -> Optional[np.ndarray]:
        """Read learner_model_embedding for one user from CourseMapper Neo4j."""
        with self.coursemapper_db.get_session() as session:
            result = session.run(
                """
                MATCH (u:User {uid: $uid})
                RETURN u.uid AS uid,
                       u.learner_model_embedding AS learner_model_embedding
                """,
                uid=uid,
            ).single()

        if not result:
            return None

        return self.string_to_array(result["learner_model_embedding"])

    def get_coursemapper_courses(self) -> List[Dict[str, Any]]:
        """Read all candidate courses from CourseMapper."""
        query = """
        MATCH (c:Course)
        WHERE c.course_embedding IS NOT NULL
          AND c.name IS NOT NULL
        RETURN c.cid AS course_id,
               c.name AS course_name,
               c.course_embedding AS course_embedding
        """

        courses: List[Dict[str, Any]] = []
        with self.coursemapper_db.get_session() as session:
            for record in session.run(query):
                emb = self.string_to_array(record["course_embedding"])
                if emb is None:
                    continue

                courses.append(
                    {
                        "course_name": record["course_name"],
                        "course_id": record["course_id"],
                        "platform": "CourseMapper platform",
                        "source_db": "coursemapper",
                        "embedding": emb,
                    }
                )

        return courses

    def get_mooccentral_courses(self) -> List[Dict[str, Any]]:
        """Read all candidate courses from MOOC Central with platform info."""
        query = """
        MATCH (c:Course)-[:AVAILABLE_ON]->(p:Platform)
        WHERE c.course_embedding IS NOT NULL
          AND c.name IS NOT NULL
        RETURN c.course_id AS course_id,
               c.name AS course_name,
               c.course_embedding AS course_embedding,
               coalesce(p.name, p.platform_name, p.title, 'Unknown platform') AS platform_name
        """

        courses: List[Dict[str, Any]] = []
        with self.mooccentral_db.get_session() as session:
            for record in session.run(query):
                emb = self.string_to_array(record["course_embedding"])
                if emb is None:
                    continue

                courses.append(
                    {
                        "course_name": record["course_name"],
                        "course_id": record["course_id"],
                        "platform": record["platform_name"],
                        "source_db": "mooccentral",
                        "embedding": emb,
                    }
                )

        return courses

    def recommend_for_user(self, uid: str, top_k: int = 20) -> List[Dict[str, Any]]:
        """
        Generate Top-K recommendations for a single user.

        Returns
        -------
        [
            {
                "rank": 1,
                "course_name": "...",
                "course_id": "...",
                "platform": "...",
                "source_db": "coursemapper/mooccentral",
                "similarity": 0.912345,
            },
            ...
        ]
        """
        user_embedding = self.get_user_embedding(uid)
        if user_embedding is None:
            raise ValueError(f"User '{uid}' not found, or learner_model_embedding is empty / invalid.")

        coursemapper_courses = self.get_coursemapper_courses()
        mooccentral_courses = self.get_mooccentral_courses()
        all_courses = coursemapper_courses + mooccentral_courses

        scored_results: List[Dict[str, Any]] = []
        for course in all_courses:
            similarity = self.cosine_similarity(user_embedding, course["embedding"])
            if similarity < -0.5:
                continue

            scored_results.append(
                {
                    "course_name": course["course_name"],
                    "course_id": course["course_id"],
                    "platform": course["platform"],
                    "source_db": course["source_db"],
                    "similarity": round(similarity, 6),
                }
            )

        scored_results.sort(key=lambda x: x["similarity"], reverse=True)
        top_results = scored_results[:top_k]

        for idx, item in enumerate(top_results, start=1):
            item["rank"] = idx

        return top_results

    @staticmethod
    def build_frontend_json(uid: str, recommendations: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Build frontend-friendly JSON structure."""
        return {
            "title": "Recommendation list Top20",
            "uid": uid,
            "count": len(recommendations),
            "recommendations": recommendations,
        }

    @staticmethod
    def recommendations_to_json(uid: str, recommendations: List[Dict[str, Any]], indent: int = 2) -> str:
        """Serialize recommendation results to JSON string."""
        payload = MoocRecommendationService.build_frontend_json(uid, recommendations)
        return json.dumps(payload, ensure_ascii=False, indent=indent)

    @staticmethod
    def print_recommendations(uid: str, recommendations: List[Dict[str, Any]]) -> None:
        print("Recommendation list Top20")
        print(f"User uid: {uid}")
        print("-" * 80)

        if not recommendations:
            print("No recommendation results.")
            return

        for item in recommendations:
            print(f"{item['rank']}. {item['course_name']}")
            print(f"   Course ID : {item['course_id']}")
            print(f"   Platform  : {item['platform']}")
            print(f"   Source DB : {item['source_db']}")
            print(f"   Similarity: {item['similarity']:.6f}")
            print()


def recommend_for_user(uid: str, top_k: int = 20) -> List[Dict[str, Any]]:
    """Convenience function for external callers."""
    coursemapper_db = CourseMapperConnection()
    mooccentral_db = MoocCentralConnection()

    try:
        service = MoocRecommendationService(coursemapper_db, mooccentral_db)
        return service.recommend_for_user(uid=uid, top_k=top_k)
    finally:
        coursemapper_db.close()
        mooccentral_db.close()


def recommend_for_user_json(uid: str, top_k: int = 20, indent: int = 2) -> str:
    """Return recommendation results as frontend-friendly JSON string."""
    results = recommend_for_user(uid=uid, top_k=top_k)
    return MoocRecommendationService.recommendations_to_json(uid=uid, recommendations=results, indent=indent)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate Top-K course recommendations for one user.")
    parser.add_argument("--uid", required=True, help="Target user uid in CourseMapper Neo4j")
    parser.add_argument("--top_k", type=int, default=20, help="Number of recommendations to return")
    parser.add_argument("--as_json", action="store_true", help="Print results as frontend-friendly JSON")
    args = parser.parse_args()

    if args.as_json:
        print(recommend_for_user_json(uid=args.uid, top_k=args.top_k))
    else:
        results = recommend_for_user(uid=args.uid, top_k=args.top_k)
        MoocRecommendationService.print_recommendations(args.uid, results)
