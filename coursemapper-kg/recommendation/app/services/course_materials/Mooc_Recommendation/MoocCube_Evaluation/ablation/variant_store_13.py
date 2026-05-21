import os
import numpy as np

from config import (
    PROCESSED_USER_JSON,
    LEARNER_TRAINING_DATA_PATH,
    USER_COURSE_FINAL_MAPPING_PATH,
    USER_CONCEPT_FINAL_MAPPING_PATH,
    COURSE_INITIAL_ID_TO_INDEX_PATH,
    CONCEPT_NAME_ID_TO_INDEX_PATH,
    COURSE_INITIAL_EMBEDDING_PATH,
    CONCEPT_NAME_EMBEDDING_PATH,
    USER_COURSE_FINAL_EMBEDDING_PATH,
    USER_CONCEPT_FINAL_EMBEDDING_PATH,
    VARIANT_DIR,
    EMBEDDING_DIM,
    RANDOM_SEED,
    ensure_directories,
)
from utils import load_json, save_json, print_info


"""
Fast variant store.


Goal:
1. Load big JSON/NPY files only once.
2. For each user, compute all 7 variants in one pass.
3. Save one .npy + one id_to_index.json for each variant.

"""


def build_random_matrix(seed):
    """Build one fixed random matrix. """
    rng = np.random.default_rng(seed)
    limit = np.sqrt(6.0 / (EMBEDDING_DIM + EMBEDDING_DIM))
    return rng.uniform(-limit, limit, size=(EMBEDDING_DIM, EMBEDDING_DIM)).astype(np.float32)


W_ENROLL = build_random_matrix(RANDOM_SEED)
W_INTEREST = build_random_matrix(RANDOM_SEED + 1)


VARIANT_TABLE = {
    1: {"component": "node_weight_sum", "use_random_matrix": True,  "use_relation_normalization": True,  "use_outer_normalization": True},
    2: {"component": "node_weight_sum", "use_random_matrix": False, "use_relation_normalization": True,  "use_outer_normalization": True},
    3: {"component": "direct_sum",      "use_random_matrix": True,  "use_relation_normalization": True,  "use_outer_normalization": True},
    4: {"component": "first_weight_sum", "use_random_matrix": True,  "use_relation_normalization": True,  "use_outer_normalization": True},
    5: {"component": "position_weight_sum", "use_random_matrix": True, "use_relation_normalization": True, "use_outer_normalization": True},
    6: {"component": "node_weight_sum", "use_random_matrix": True,  "use_relation_normalization": False, "use_outer_normalization": False},
    7: {"component": "node_weight_sum", "use_random_matrix": False, "use_relation_normalization": False, "use_outer_normalization": False},
}


def _safe_row_cosine(matrix_a, matrix_b):
    """
    Row-wise cosine similarity.
   
    """
    dots = np.sum(matrix_a * matrix_b, axis=1)
    norms_a = np.linalg.norm(matrix_a, axis=1)
    norms_b = np.linalg.norm(matrix_b, axis=1)
    denom = norms_a * norms_b
    output = np.zeros(len(dots), dtype=np.float32)
    mask = denom > 0
    output[mask] = (dots[mask] / denom[mask]).astype(np.float32)
    return output


def _mean_course_initial_embedding(training_courses, course_id_to_index, course_initial_embeddings):
    """
    Build learner initial embedding from training courses.
   
    """
    indices = []
    for item in training_courses:
        course_id = str(item.get("course_id", "")).strip()
        if course_id in course_id_to_index:
            indices.append(int(course_id_to_index[course_id]))

    if not indices:
        return None

    return np.mean(course_initial_embeddings[np.array(indices, dtype=np.int32)], axis=0).astype(np.float32)


def _prepare_enroll_components(user_id, training_item, user_course_final_mapping, course_id_to_index,
                               course_initial_embeddings, user_course_final_embeddings):
    """
    Prepare ENROLL components for one user.
   
    """
    zero = np.zeros(EMBEDDING_DIM, dtype=np.float32)

    # Keep the last node if duplicated by course_id.
   
    node_map = {}
    for item in user_course_final_mapping.get(user_id, []):
        course_id = str(item.get("course_id", "")).strip()
        if course_id and course_id in course_id_to_index:
            node_map[course_id] = {
                "time": item.get("enroll_time"),
                "final_idx": int(item.get("course_final_embedding_index")),
                "initial_idx": int(course_id_to_index[course_id]),
            }

    entries = list(node_map.values())
    node_count = len(entries)
    if node_count == 0:
        return {
            "exists": False,
            "node_count": 0,
            "ignore_position": True,
            "relation_weight_sum": 0.0,
            "direct_sum": zero.copy(),
            "node_weight_sum": zero.copy(),
            "first_weight_sum": zero.copy(),
            "position_weight_sum": zero.copy(),
        }

    times = [x["time"] for x in entries]
    ignore_position = (node_count == 1) or (len(set(times)) == 1)

    final_indices = np.array([x["final_idx"] for x in entries], dtype=np.int32)
    initial_indices = np.array([x["initial_idx"] for x in entries], dtype=np.int32)

    final_vectors = user_course_final_embeddings[final_indices].astype(np.float32)
    initial_vectors = course_initial_embeddings[initial_indices].astype(np.float32)

    learner_initial_embedding = _mean_course_initial_embedding(
        training_item.get("training_courses", []),
        course_id_to_index,
        course_initial_embeddings,
    )

    if learner_initial_embedding is None:
        first_weights = np.zeros(node_count, dtype=np.float32)
    else:
        learner_matrix = np.repeat(learner_initial_embedding.reshape(1, -1), node_count, axis=0)
        first_weights = _safe_row_cosine(learner_matrix, initial_vectors)

    if ignore_position:
        position_weights = np.zeros(node_count, dtype=np.float32)
        node_weights = first_weights.astype(np.float32)
    else:
        unique_times = sorted(set(times))
        time_to_position = {t: i for i, t in enumerate(unique_times)}
        position_times = np.array([time_to_position[t] for t in times], dtype=np.float32)
        position_weights = position_times / float(node_count - 1)
        node_weights = ((first_weights + position_weights) / 2.0).astype(np.float32)

    return {
        "exists": True,
        "node_count": node_count,
        "ignore_position": ignore_position,
        "relation_weight_sum": float(node_weights.sum()),
        "direct_sum": final_vectors.sum(axis=0).astype(np.float32),
        "node_weight_sum": (node_weights[:, None] * final_vectors).sum(axis=0).astype(np.float32),
        "first_weight_sum": (first_weights[:, None] * final_vectors).sum(axis=0).astype(np.float32),
        "position_weight_sum": (position_weights[:, None] * final_vectors).sum(axis=0).astype(np.float32),
    }


def _prepare_interest_components(user_id, user_concept_final_mapping, concept_id_to_index,
                                 concept_name_embeddings, course_id_to_index, course_initial_embeddings,
                                 user_concept_final_embeddings):
    """
    Prepare INTEREST components for one user.
    为一个用户准备 INTEREST 关系的组件。
    """
    zero = np.zeros(EMBEDDING_DIM, dtype=np.float32)

    # Keep the last node if duplicated by concept_id.
   
    node_map = {}
    for item in user_concept_final_mapping.get(user_id, []):
        concept_id = str(item.get("concept_id", "")).strip()
        source_course_id = str(item.get("source_course_id", "")).strip()
        if concept_id and concept_id in concept_id_to_index and source_course_id in course_id_to_index:
            node_map[concept_id] = {
                "time": item.get("interest_time"),
                "final_idx": int(item.get("concept_final_embedding_index")),
                "concept_idx": int(concept_id_to_index[concept_id]),
                "course_idx": int(course_id_to_index[source_course_id]),
            }

    entries = list(node_map.values())
    node_count = len(entries)
    if node_count == 0:
        return {
            "exists": False,
            "node_count": 0,
            "ignore_position": True,
            "relation_weight_sum": 0.0,
            "direct_sum": zero.copy(),
            "node_weight_sum": zero.copy(),
            "first_weight_sum": zero.copy(),
            "position_weight_sum": zero.copy(),
        }

    times = [x["time"] for x in entries]
    ignore_position = (node_count == 1) or (len(set(times)) == 1)

    final_indices = np.array([x["final_idx"] for x in entries], dtype=np.int32)
    concept_indices = np.array([x["concept_idx"] for x in entries], dtype=np.int32)
    course_indices = np.array([x["course_idx"] for x in entries], dtype=np.int32)

    final_vectors = user_concept_final_embeddings[final_indices].astype(np.float32)
    concept_vectors = concept_name_embeddings[concept_indices].astype(np.float32)
    source_course_vectors = course_initial_embeddings[course_indices].astype(np.float32)

    first_weights = _safe_row_cosine(concept_vectors, source_course_vectors)

    if ignore_position:
        position_weights = np.zeros(node_count, dtype=np.float32)
        node_weights = first_weights.astype(np.float32)
    else:
        unique_times = sorted(set(times))
        time_to_position = {t: i for i, t in enumerate(unique_times)}
        position_times = np.array([time_to_position[t] for t in times], dtype=np.float32)
        position_weights = position_times / float(node_count - 1)
        node_weights = ((first_weights + position_weights) / 2.0).astype(np.float32)

    return {
        "exists": True,
        "node_count": node_count,
        "ignore_position": ignore_position,
        "relation_weight_sum": float(node_weights.sum()),
        "direct_sum": final_vectors.sum(axis=0).astype(np.float32),
        "node_weight_sum": (node_weights[:, None] * final_vectors).sum(axis=0).astype(np.float32),
        "first_weight_sum": (first_weights[:, None] * final_vectors).sum(axis=0).astype(np.float32),
        "position_weight_sum": (position_weights[:, None] * final_vectors).sum(axis=0).astype(np.float32),
    }


def _choose_component_vector(components, component_name):
    """
    Choose one component vector.
    

    Variant 5 rule:
    If ignore_position is True, position_weight_sum degenerates to direct_sum.
   
    """
    if component_name == "position_weight_sum" and components["ignore_position"]:
        return components["direct_sum"]
    return components[component_name]


def _build_one_relation_term(components, matrix, setting):
    """Build one relation term. / 构造一个关系项。"""
    if not components["exists"]:
        return np.zeros(EMBEDDING_DIM, dtype=np.float32)

    term = _choose_component_vector(components, setting["component"]).copy()

    if setting["use_relation_normalization"] and components["relation_weight_sum"] != 0:
        term = term / components["relation_weight_sum"]

    if setting["use_random_matrix"]:
        term = matrix @ term

    return term.astype(np.float32)


def _combine_two_relation_terms(enroll_term, interest_term, enroll_components, interest_components, setting):
    """
    Combine ENROLL and INTEREST into the final learner embedding.
   
    """
    enroll_exists = enroll_components["exists"]
    interest_exists = interest_components["exists"]

    if (not enroll_exists) and (not interest_exists):
        return np.zeros(EMBEDDING_DIM, dtype=np.float32)
    if enroll_exists and (not interest_exists):
        return enroll_term.astype(np.float32)
    if interest_exists and (not enroll_exists):
        return interest_term.astype(np.float32)

    final_embedding = enroll_term + interest_term
    if setting["use_outer_normalization"]:
        total_weight_sum = enroll_components["relation_weight_sum"] + interest_components["relation_weight_sum"]
        if total_weight_sum != 0:
            final_embedding = final_embedding / total_weight_sum
    return final_embedding.astype(np.float32)


def _load_all_once():
    """Load all shared files once."""
    users = load_json(PROCESSED_USER_JSON)
    learner_training = load_json(LEARNER_TRAINING_DATA_PATH)
    user_course_final_mapping = load_json(USER_COURSE_FINAL_MAPPING_PATH)
    user_concept_final_mapping = load_json(USER_CONCEPT_FINAL_MAPPING_PATH)
    course_id_to_index = load_json(COURSE_INITIAL_ID_TO_INDEX_PATH)
    concept_id_to_index = load_json(CONCEPT_NAME_ID_TO_INDEX_PATH)

    bundle = {
        "user_ids": [str(item.get("user_id", "")).strip() for item in users if item.get("user_id")],
        "training_by_user": {str(item.get("user_id", "")).strip(): item for item in learner_training if item.get("user_id")},
        "user_course_final_mapping": user_course_final_mapping,
        "user_concept_final_mapping": user_concept_final_mapping,
        "course_id_to_index": course_id_to_index,
        "concept_id_to_index": concept_id_to_index,
        "course_initial_embeddings": np.load(COURSE_INITIAL_EMBEDDING_PATH).astype(np.float32),
        "concept_name_embeddings": np.load(CONCEPT_NAME_EMBEDDING_PATH).astype(np.float32),
        "user_course_final_embeddings": np.load(USER_COURSE_FINAL_EMBEDDING_PATH).astype(np.float32),
        "user_concept_final_embeddings": np.load(USER_CONCEPT_FINAL_EMBEDDING_PATH).astype(np.float32),
    }
    return bundle


def save_all_variant_embeddings(force=False):
    """
    Save all 7 variants in one pass.
   
    """
    ensure_directories()

    all_exist = True
    for variant_id in range(1, 8):
        emb_path = os.path.join(VARIANT_DIR, f"variant_{variant_id}_embeddings.npy")
        map_path = os.path.join(VARIANT_DIR, f"variant_{variant_id}_id_to_index.json")
        if not (os.path.exists(emb_path) and os.path.exists(map_path)):
            all_exist = False
            break

    if all_exist and not force:
        print_info("All variant embedding files already exist. Skip rebuilding.")
        return

    bundle = _load_all_once()
    user_ids = bundle["user_ids"]
    user_id_to_index = {user_id: i for i, user_id in enumerate(user_ids)}
    outputs = {variant_id: [] for variant_id in range(1, 8)}

    print_info(f"Start building 7 variants for {len(user_ids)} users...")

    for idx, user_id in enumerate(user_ids, start=1):
        training_item = bundle["training_by_user"].get(user_id, {})

        enroll_components = _prepare_enroll_components(
            user_id=user_id,
            training_item=training_item,
            user_course_final_mapping=bundle["user_course_final_mapping"],
            course_id_to_index=bundle["course_id_to_index"],
            course_initial_embeddings=bundle["course_initial_embeddings"],
            user_course_final_embeddings=bundle["user_course_final_embeddings"],
        )
        interest_components = _prepare_interest_components(
            user_id=user_id,
            user_concept_final_mapping=bundle["user_concept_final_mapping"],
            concept_id_to_index=bundle["concept_id_to_index"],
            concept_name_embeddings=bundle["concept_name_embeddings"],
            course_id_to_index=bundle["course_id_to_index"],
            course_initial_embeddings=bundle["course_initial_embeddings"],
            user_concept_final_embeddings=bundle["user_concept_final_embeddings"],
        )

        for variant_id, setting in VARIANT_TABLE.items():
            enroll_term = _build_one_relation_term(enroll_components, W_ENROLL, setting)
            interest_term = _build_one_relation_term(interest_components, W_INTEREST, setting)
            emb = _combine_two_relation_terms(
                enroll_term,
                interest_term,
                enroll_components,
                interest_components,
                setting,
            )
            outputs[variant_id].append(emb)

        if idx % 500 == 0 or idx == len(user_ids):
            print_info(f"Built variants for {idx}/{len(user_ids)} users")

    for variant_id in range(1, 8):
        emb_array = np.array(outputs[variant_id], dtype=np.float32)
        np.save(os.path.join(VARIANT_DIR, f"variant_{variant_id}_embeddings.npy"), emb_array)
        save_json(user_id_to_index, os.path.join(VARIANT_DIR, f"variant_{variant_id}_id_to_index.json"))

    print_info("All 7 variant embedding files have been saved.")


def save_variant_embeddings(variant_id, force=False):
    """
    Keep the old function name for compatibility.
   
    """
    if variant_id not in VARIANT_TABLE:
        raise ValueError(f"Unsupported variant_id: {variant_id}")

    emb_path = os.path.join(VARIANT_DIR, f"variant_{variant_id}_embeddings.npy")
    map_path = os.path.join(VARIANT_DIR, f"variant_{variant_id}_id_to_index.json")
    if (not force) and os.path.exists(emb_path) and os.path.exists(map_path):
        embeddings = np.load(emb_path).astype(np.float32)
        user_id_to_index = load_json(map_path)
        return embeddings, user_id_to_index

    save_all_variant_embeddings(force=force)
    embeddings = np.load(emb_path).astype(np.float32)
    user_id_to_index = load_json(map_path)
    return embeddings, user_id_to_index


def load_variant_embeddings(variant_id):
    """Load one saved variant embedding file."""
    emb_path = os.path.join(VARIANT_DIR, f"variant_{variant_id}_embeddings.npy")
    map_path = os.path.join(VARIANT_DIR, f"variant_{variant_id}_id_to_index.json")
    embeddings = np.load(emb_path).astype(np.float32)
    user_id_to_index = load_json(map_path)
    return embeddings, user_id_to_index


if __name__ == "__main__":
    save_all_variant_embeddings(force=False)
