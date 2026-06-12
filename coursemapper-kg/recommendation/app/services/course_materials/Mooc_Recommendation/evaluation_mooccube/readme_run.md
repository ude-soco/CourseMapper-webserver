# README_how_to_run.md

# MOOCCube Evaluation Pipeline

## 1. How to Run

Run the evaluation pipeline from **Step 01 to Step 13** in order.

Only **Step 08** is a helper file and does not need to be run separately.

All other step files should be run according to their step number. The running command is written at the top of each step file.

---

---

## 2. Step-by-Step Description

### Step 01: Data Preprocessing

Step 01 processes the original MOOCCube dataset.

It reads:

```text
dataset/original/user.json
dataset/original/course.json
dataset/original/concept.json
dataset/original/course-concept.json
```

It filters and processes users, courses, concepts, and course-concept relations.
For each user, it splits courses into training courses and test courses according to time.

It outputs:

```text
dataset/processed/processed_users.jsonl
dataset/processed/processed_courses.jsonl
dataset/processed/processed_concepts.jsonl
dataset/processed/processed_course_concepts.jsonl
```

---

### Step 02: Concept Name Embeddings

Step 02 generates embeddings for concept names.

It reads:

```text
dataset/processed/processed_concepts.jsonl
```

It uses SBERT to encode each concept name.

It outputs:

```text
output/embeddings/concept_embeddings/concept_name_embeddings.npy
output/embeddings/concept_embeddings/concept_id_to_index.json
```

---

### Step 03: Course Name Embeddings

Step 03 generates embeddings for course names.

It reads:

```text
dataset/processed/processed_courses.jsonl
```

It uses SBERT to encode each course name.

It outputs:

```text
output/embeddings/course_embeddings/course_name_embeddings.npy
output/embeddings/course_embeddings/course_id_to_index.json
```

---

### Step 04: Course Embeddings

Step 04 generates course embeddings.

It reads course name embeddings, concept name embeddings, and course-concept information.

The purpose is to compute the course embedding according to the course-concept weighting formula.

It outputs:

```text
output/embeddings/course_embeddings/course_embeddings.npy
```

---

### Step 05: Select Top-20 Course Concepts

Step 05 selects the Top-20 related concepts for each course.

These selected concepts are later used to construct the user's interested relation.

It outputs:

```text
output/selected_concepts/course_top20_concepts.jsonl
```

---

### Step 06: Raw Relationship Dictionaries

Step 06 builds raw relationship dictionaries.

Here, “raw” means the information that can be directly recorded from dataset.

For each user, it records basic relation information such as:

```text
user_id
relation_name
node_id
timestamp
```

It outputs:

```text
output/relationship_info/raw_enrolled_relationship_dictionary.jsonl
output/relationship_info/raw_interested_relationship_dictionary.jsonl
```

---

### Step 07: Node Weight Components

Step 07 computes node weight components.

It reads:

```text
raw_enrolled_relationship_dictionary.jsonl
raw_interested_relationship_dictionary.jsonl
```

For each node, it computes:

```text
timestamp
position_time
position_weight
first_weight_component
full_node_weight
```

It also computes the weight sum under each relation.

It outputs:

```text
output/relationship_info/enrolled_relation_info.jsonl
output/relationship_info/interested_relation_info.jsonl
output/relationship_info/node_weight_statistics.json
```

---

### Step 08: Updated Embeddings

Its purpose is to use the sequence matrix to capture the long-term interest information under a specific relation.

---

### Step 09: Relationship Components

Step 09 prepares relationship-level components for later user embedding variants.

It mainly does the following:

- Generate random relation-specific matrices for each relation.
- Provide helper functions for selecting node weight types.
- Compute reusable relationship components.
- Compute relation-level weight sums.
- Prepare components that can be directly used by later variants.

The purpose is to pre-compute reusable components.
Then, in the user embedding step, each variant can directly select the components it needs.

It outputs:

```text
output/relationship_info/relation_specific_matrices.npz
```

---

### Step 10: User Embedding Variants

Step 10 computes user embeddings for different variants.

Each variant defines how to combine relationship components, node weights, relation-specific matrices, and normalization settings.

It outputs user embeddings under:

```text
output/embeddings/user_embeddings/
```

---

### Step 11: Negative Sampling

Step 11 generates negative samples.

It uses test courses as positive courses and samples negative courses from courses the user has not enrolled.

It outputs:

```text
output/negative_samples/negative_samples.jsonl
```

---

### Step 12: Recommendation Lists

Step 12 generates recommendation lists.

For each user, it computes cosine similarity between the user embedding and candidate course embeddings, then ranks candidate courses.

It outputs recommendation results under:

```text
output/recommendation_results/
```

---

### Step 13: Evaluation Metrics

Step 13 computes evaluation metrics.

It reads recommendation results and uses test courses as ground truth.

It computes:

```text
HR@K
NDCG@K
```

It outputs:

```text
output/metrics/evaluation_metrics.json
output/metrics/metrics_summary.txt
```
