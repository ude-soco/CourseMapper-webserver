# README_version_update.md

# MOOCCube Evaluation Version Update

## 1. Reason for the Update

The old evaluation code can run the full evaluation pipeline. However, the file naming, intermediate computation process, and data organization are not clear enough.

The old version explicitly saves large updated embedding files, such as:
```text
user_course_updated_embeddings.npy
user_concept_updated_embeddings.npy
```
These files store updated embeddings for user-specific course nodes and concept nodes. They are very large. In the new version, these updated embeddings are not saved as core intermediate matrix files. They are treated as part of the computation process.

The new version also improves the organization of relationship information. Important relation-level and node-level information is saved locally as JSONL files, which makes the pipeline easier to inspect and debug.

In addition, the sequence matrix computation problem in the old version has been fixed in the new version.

---

## 2. Main Difference

The old version mainly relies on two relationship dictionaries:

```text
user_enroll_relation_dict
user_interest_relation_dict
```

### 2.1 Old ENROLL Dictionary

```python
user_enroll_relation_dict = {
    "ENROLL": {
        "summary": {
            "relation_type": "ENROLL",
            "node_count": ...,
            "ignore_position": ...,
            "relation_weight_sum": ...,
            "has_enroll_relationship": ...
        },
        "nodes": {
            "course_id": {
                "course_id": ...,
                "enroll_time": ...,
                "position_time": ...,
                "position_weight": ...,
                "first_weight_component": ...,
                "node_weight": ...,
                "course_updated_embedding_index": ...,
                "course_embedding_index": ...
            }
        }
    }
}
```

This dictionary is mainly used as an intermediate structure during computation. It is not clearly saved as a local JSONL file for later inspection.

### 2.2 Old INTEREST Dictionary

```python
user_interest_relation_dict = {
    "INTEREST": {
        "summary": {
            "relation_type": "INTEREST",
            "node_count": ...,
            "ignore_position": ...,
            "relation_weight_sum": ...,
            "has_interest_relationship": ...
        },
        "nodes": {
            "concept_id": {
                "concept_id": ...,
                "interest_time": ...,
                "source_course_id": ...,
                "position_time": ...,
                "position_weight": ...,
                "first_weight_component": ...,
                "node_weight": ...,
                "concept_updated_embedding_index": ...,
                "concept_name_embedding_index": ...,
                "source_course_embedding_index": ...
            }
        }
    }
}
```

This has a similar role to the ENROLL dictionary.

---

## 3. New Relationship Information Structure

The new version saves important relationship information as JSONL files:

```text
enrolled_relation_info.jsonl
interested_relation_info.jsonl
```

Each line represents one user under one relation.

### 3.1 New Enrolled Relation Info

```python
{
    "user_id": "...",
    "relation_name": "enrolled",
    "node_count": ...,
    "position_available": ...,
    "inner_weight_sum": ...,
    "nodes": [
        {
            "course_id": "...",
            "timestamp": "...",
            "position_time": ...,
            "position_weight": ...,
            "first_weight_component": ...,
            "full_node_weight": ...
        }
    ]
}
```

### 3.2 New Interested Relation Info

```python
{
    "user_id": "...",
    "relation_name": "interested",
    "node_count": ...,
    "position_available": ...,
    "inner_weight_sum": ...,
    "nodes": [
        {
            "concept_id": "...",
            "source_course_id": "...",
            "timestamp": "...",
            "position_time": ...,
            "position_weight": ...,
            "first_weight_component": ...,
            "full_node_weight": ...
        }
    ]
}
```

---

## 4. Advantages of the New Version

1. Relationship information is easier to inspect.

2. The pipeline is closer to the learner model implementation logic.

3. Large updated embedding matrix files are no longer saved as core intermediate files.

4. File naming and pipeline structure are clearer.
