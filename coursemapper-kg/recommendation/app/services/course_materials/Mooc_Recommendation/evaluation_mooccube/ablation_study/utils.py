"""
utils.py

Small helper functions for MOOCCube evaluation.

Current scope:
- Step 01: dataset process
- Step 02: concept name embeddings
- Step 03: course name embeddings
- Step 04: final course embeddings
- Step 05: selected top-20 course concepts
"""

import os
import json
import numpy as np


# ============================================================
# Logging helpers
# ============================================================

def print_info(message):
    """Print an information message."""
    print(f"[INFO] {message}")


def print_warning(message):
    """Print a warning message."""
    print(f"[WARNING] {message}")


# ============================================================
# Path helpers
# ============================================================

def ensure_parent_dir(path):
    """
    Create the parent folder of a file path if it does not exist.
    """
    parent_dir = os.path.dirname(path)

    if parent_dir:
        os.makedirs(parent_dir, exist_ok=True)


# ============================================================
# JSON helpers
# ============================================================

def load_json(path):
    """
    Load a normal JSON file.
    """
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_json(data, path):
    """
    Save data as a normal JSON file.
    """
    ensure_parent_dir(path)

    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)


def load_jsonl(path):
    """
    Load a JSONL file.

    JSONL means:
    one JSON object per line.
    """
    records = []

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()

            if line:
                records.append(json.loads(line))

    return records


def save_jsonl(records, path):
    """
    Save records as JSONL.
    """
    ensure_parent_dir(path)

    with open(path, "w", encoding="utf-8") as f:
        for record in records:
            f.write(json.dumps(record, ensure_ascii=False) + "\n")


# ============================================================
# TXT helpers
# ============================================================

def save_txt(lines, path):
    """
    Save a list of text lines into a txt file.
    """
    ensure_parent_dir(path)

    with open(path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


# ============================================================
# NumPy helpers
# ============================================================

def save_npy(array, path):
    """
    Save a numpy array as .npy file.
    """
    ensure_parent_dir(path)
    np.save(path, array)


def load_npy(path):
    """
    Load a numpy array from .npy file.
    """
    return np.load(path)


# ============================================================
# Course-concept helpers
# ============================================================

def load_course_concept_pairs(path):
    """
    Load course-concept pairs from the original course-concept file.

    We assume each valid line has:
        course_id concept_id
    """
    pairs = []

    with open(path, "r", encoding="utf-8") as f:
        for line in f:
            parts = line.strip().split()

            if len(parts) >= 2:
                course_id = parts[0]
                concept_id = parts[1]
                pairs.append((course_id, concept_id))

    return pairs


# ============================================================
# Embedding helpers
# ============================================================

def cosine_similarity(vector_a, vector_b):
    """
    Compute cosine similarity between two vectors.

    If one vector is zero, return 0.0.
    """
    vector_a = np.asarray(vector_a, dtype=np.float32)
    vector_b = np.asarray(vector_b, dtype=np.float32)

    norm_a = np.linalg.norm(vector_a)
    norm_b = np.linalg.norm(vector_b)

    if norm_a == 0 or norm_b == 0:
        return 0.0

    return float(np.dot(vector_a, vector_b) / (norm_a * norm_b))


def weighted_average(embeddings, weights):
    """
    Compute weighted average of embeddings.

    Used in Step 04:
        final_course_embedding
        =
        sum(score_k * concept_embedding_k) / sum(score_k)

    If the weight sum is 0, return None.
    """
    embeddings = np.asarray(embeddings, dtype=np.float32)
    weights = np.asarray(weights, dtype=np.float32)

    weight_sum = np.sum(weights)

    if weight_sum == 0:
        return None

    return np.sum(embeddings * weights[:, None], axis=0) / weight_sum


# ============================================================
# Counter display helper
# ============================================================

def summarize_counter(counter, title):
    """
    Convert a Counter into readable text lines.

    Example:
        1      -> 2202
        2      -> 2141
    """
    lines = []
    lines.append(title)
    lines.append("-" * 60)

    for key in sorted(counter.keys()):
        lines.append(f"{key:<6} -> {counter[key]}")

    lines.append("")
    return lines