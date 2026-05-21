import os
import random

from config import (
    PROCESSED_USER_JSON,
    COURSE_INITIAL_ID_TO_INDEX_PATH,
    TEST_OUTPUT_DIR,
    NEGATIVE_SAMPLE_SIZE,
    RANDOM_SEED,
    ensure_directories,
)
from utils import load_json, save_json, deduplicate_keep_order


"""
This file only does one thing:
Generate positive courses, negative courses, and candidate courses for each user.

"""


NEGATIVE_SAMPLE_OUTPUT_PATH = os.path.join(TEST_OUTPUT_DIR, "negative_sample.json")



def generate_negative_sample(seed=RANDOM_SEED):
    # Step 1: Read processed users and all available course ids.
   
    users = load_json(PROCESSED_USER_JSON)
    course_id_to_index = load_json(COURSE_INITIAL_ID_TO_INDEX_PATH)
    all_course_ids = list(course_id_to_index.keys())

    # Step 2: For each user, build positive samples, negative samples, and candidate courses.
  
    output = {}

    for item in users:
        user_id = str(item.get("user_id", "")).strip()
        if not user_id:
            continue

        train_course_ids = [str(x.get("course_id", "")).strip() for x in item.get("train_courses", []) if x.get("course_id")]
        test_course_ids = [str(x.get("course_id", "")).strip() for x in item.get("test_courses", []) if x.get("course_id")]

        positive_course_ids = deduplicate_keep_order(test_course_ids)
        learned_course_ids = set(train_course_ids) | set(test_course_ids)
        negative_pool = [cid for cid in all_course_ids if cid not in learned_course_ids]

        sampled_negative_course_ids = []
        base_seed = seed + sum(ord(c) for c in user_id)

        # For each positive item, sample 99 negatives.
      
        for i, _ in enumerate(positive_course_ids):
            rng = random.Random(base_seed + i)
            sample_size = min(NEGATIVE_SAMPLE_SIZE, len(negative_pool))
            sampled_negative_course_ids.extend(rng.sample(negative_pool, sample_size))

        # Remove duplicated negatives and build the final candidate set.
     
        negative_course_ids = deduplicate_keep_order(sampled_negative_course_ids)
        candidate_course_ids = deduplicate_keep_order(positive_course_ids + negative_course_ids)

        output[user_id] = {
            "positive_course_ids": positive_course_ids,
            "negative_course_ids": negative_course_ids,
            "candidate_course_ids": candidate_course_ids,
        }

    # Step 3: Save the negative sampling result.
    
    ensure_directories()
    save_json(output, NEGATIVE_SAMPLE_OUTPUT_PATH)
    return output
