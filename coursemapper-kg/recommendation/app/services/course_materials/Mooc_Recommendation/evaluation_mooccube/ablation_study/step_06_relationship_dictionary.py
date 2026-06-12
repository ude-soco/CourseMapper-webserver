"""
step_06_relationship_dictionary.py

Goal: Build raw relationship dictionaries for the learner model.

Inputs:
------------
    1. processed_users.jsonl
    2. course_top20_concepts.jsonl

Outputs:
------------
    1. raw_enrolled_relationship_dictionary.jsonl
    2. raw_interested_relationship_dictionary.jsonl

Run:
    cd coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/evaluation_mooccube/ablation_study
    python step_06_relationship_dictionary.py
"""

from config import *
from utils import *


# ============================================================
# Helper functions. Read course_top20_concepts.jsonl to build course_id -> top_concepts dictionary.
# ============================================================

def build_course_concept_dict(course_top20_records):
    """
    Build course_id -> top_concepts dictionary.

    Example:
        {
            "C1": [
                {"concept_id": "K1", "score": 0.87, "rank": 1},
                {"concept_id": "K2", "score": 0.82, "rank": 2},
                ...
            ]
        }
    """
    course_concept_dict = {}

    for record in course_top20_records:
        course_id = record["course_id"]
        top_concepts = record.get("top_concepts", [])
        course_concept_dict[course_id] = top_concepts

    return course_concept_dict


def build_enrolled_record(user):
    """
    Build raw enrolled relation for one user.
    Only train_courses are used for learner model construction.
    """
    user_id = user["user_id"]
    train_courses = user.get("train_courses", [])

    nodes = []

    for course in train_courses:
        nodes.append(
            {
                "course_id": course["course_id"],
                "timestamp": course["enroll_time"],
            }
        )

    # Sort by timestamp first, then course_id for deterministic output.
    nodes.sort(key=lambda x: (x["timestamp"], x["course_id"]))

    return {
        "user_id": user_id,
        "relation_name": "enrolled",
        "nodes": nodes,
    }


def build_interested_record(user, course_concept_dict):
    """
    Build raw interested relation for one user.

    Rule:
        User enrolled Course
        Course has top-20 Concepts
        => User interested Concept

    Deduplication:
        For the same user_id + concept_id,
        keep only the occurrence with the latest timestamp.
    """
    user_id = user["user_id"]
    train_courses = user.get("train_courses", [])

    concept_node_dict = {}

    for course in train_courses:
        source_course_id = course["course_id"]
        timestamp = course["enroll_time"]

        top_concepts = course_concept_dict.get(source_course_id, [])

        for concept in top_concepts:
            concept_id = concept["concept_id"]

            new_node = {
                "concept_id": concept_id,
                "source_course_id": source_course_id,
                "timestamp": timestamp,
            }

            old_node = concept_node_dict.get(concept_id)

            if old_node is None:
                concept_node_dict[concept_id] = new_node
            else:
                # Keep the latest timestamp.
                # If timestamps are equal, use source_course_id as a stable tie-breaker.
                new_key = (new_node["timestamp"], new_node["source_course_id"])
                old_key = (old_node["timestamp"], old_node["source_course_id"])

                if new_key > old_key:
                    concept_node_dict[concept_id] = new_node

    nodes = list(concept_node_dict.values())

    # Sort by timestamp, source_course_id, and concept_id for deterministic output.
    nodes.sort(
        key=lambda x: (
            x["timestamp"],
            x["source_course_id"],
            x["concept_id"],
        )
    )

    return {
        "user_id": user_id,
        "relation_name": "interested",
        "nodes": nodes,
    }


def build_relationship_dictionaries(users, course_concept_dict):
    """
    Build raw enrolled and interested relationship dictionaries for all users.
    """
    enrolled_records = []
    interested_records = []

    for user in users:
        enrolled_record = build_enrolled_record(user)
        interested_record = build_interested_record(user, course_concept_dict)

        if enrolled_record["nodes"]:
            enrolled_records.append(enrolled_record)

        # Some users may have no interested concepts.
        # In that case, the user only has enrolled relation.
        if interested_record["nodes"]:
            interested_records.append(interested_record)

    return enrolled_records, interested_records


# ============================================================
# Main
# ============================================================

def main():
    """
    Run Step 06.
    """
    ensure_directories()

    print_info("Step 06: building raw relationship dictionaries...")

    users = load_jsonl(PROCESSED_USERS_JSONL)
    course_top20_records = load_jsonl(COURSE_TOP20_CONCEPTS_JSONL)

    course_concept_dict = build_course_concept_dict(course_top20_records)

    enrolled_records, interested_records = build_relationship_dictionaries(
        users,
        course_concept_dict,
    )

    save_jsonl(
        enrolled_records,
        RAW_ENROLLED_RELATIONSHIP_DICTIONARY_JSONL,
    )

    save_jsonl(
        interested_records,
        RAW_INTERESTED_RELATIONSHIP_DICTIONARY_JSONL,
    )

    print_info("Step 06 finished.")
    print_info(f"Users: {len(users)}")
    print_info(f"Enrolled relation records: {len(enrolled_records)}")
    print_info(f"Interested relation records: {len(interested_records)}")


if __name__ == "__main__":
    main()