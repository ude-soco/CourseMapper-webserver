# MOOC Recommendation Pipeline

This README explains how to run the MOOC recommendation pipeline.

The pipeline includes four main steps:

1. Generate course embeddings for all CourseMapper courses.
2. Generate course embeddings for all MOOC Central courses.
3. Generate learner-model embeddings for all CourseMapper users.
4. Generate a recommendation list for one specific user.

---

## Project Root

Before running the commands, go to the `recommendation` directory:

```bash
cd coursemapper-kg/recommendation
```

All commands below should be executed from this directory.

---

## Running Order

Run the scripts in the following order:

```bash
# 1. Generate CourseMapper course embeddings
pipenv run python -m app.services.course_materials.Mooc_Recommendation.course_embedding.CourseMapper_final

# 2. Generate MOOC Central course embeddings
pipenv run python -m app.services.course_materials.Mooc_Recommendation.course_embedding.MoocCentral_final

# 3. Generate learner-model embeddings for all CourseMapper users
pipenv run python -m app.services.course_materials.Mooc_Recommendation.learner_model.learner_model

# 4. Generate recommendations for one specific user
pipenv run python -m app.services.course_materials.Mooc_Recommendation.mooc_recommendation --uid <USER_UID>
```

---

## 1. Generate CourseMapper Course Embeddings

This step generates embeddings for all courses in the CourseMapper database.

**File:**

```text
coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/course_embedding/CourseMapper_final.py
```

**Run:**

```bash
pipenv run python -m app.services.course_materials.Mooc_Recommendation.course_embedding.CourseMapper_final
```

**Expected output in Neo4j:**

```text
Course.course_embedding
```

---

## 2. Generate MOOC Central Course Embeddings

This step generates embeddings for all courses in the MOOC Central database.

**File:**

```text
coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/course_embedding/MoocCentral_final.py
```

**Run:**

```bash
pipenv run python -m app.services.course_materials.Mooc_Recommendation.course_embedding.MoocCentral_final
```

**Expected output in Neo4j:**

```text
Course.course_embedding
```

---

## 3. Generate Learner-Model Embeddings for All CourseMapper Users

This step generates learner-model embeddings for all users in CourseMapper.

The script reads all `User` nodes from CourseMapper Neo4j, computes a learner-model embedding for each user, and stores the result back into Neo4j.

**File:**

```text
coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/learner_model/learner_model.py
```

**Run:**

```bash
pipenv run python -m app.services.course_materials.Mooc_Recommendation.learner_model.learner_model
```

**Expected output in Neo4j:**

```text
User.learner_model_embedding
```

---

## 4. Generate Recommendations for One User

After course embeddings and learner-model embeddings are ready, run the recommendation script for a specific user.

The script reads one user's `learner_model_embedding`, compares it with all available course embeddings from CourseMapper and MOOC Central, and returns a ranked recommendation list.

**File:**

```text
coursemapper-kg/recommendation/app/services/course_materials/Mooc_Recommendation/mooc_recommendation.py
```

**Run:**

```bash
pipenv run python -m app.services.course_materials.Mooc_Recommendation.mooc_recommendation --uid <USER_UID>
```

Replace `<USER_UID>` with the actual user ID.


---

## Optional: Output Recommendations as JSON

To output the recommendation result as JSON, run:

```bash
pipenv run python -m app.services.course_materials.Mooc_Recommendation.mooc_recommendation --uid <USER_UID> --as_json
```

---
