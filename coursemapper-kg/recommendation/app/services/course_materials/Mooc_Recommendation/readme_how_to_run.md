# MOOC Recommendation Pipeline

The pipeline includes four main steps:

Step 1. Generate course embeddings for all CourseMapper courses.
Step 2. Generate course embeddings for all MOOC Central courses.
Step 3. Generate learner-model embeddings for current CourseMapper user.
Step 4. Generate a recommendation list for current CourseMapper user.



## Call Flow

```text
worker.py
  ↓
app/services/course_materials/course_materials.py
  ↓
get_MOOC_recommendations(job)
  ↓
RecService in:
app/services/course_materials/kwp_extraction/dbpedia/data_service1.py
  ↓
_construct_user_MOOC(user_id)
_get_MOOC_recommendation(user_id)
  ↓
MOOCRecommendationList in:
app/services/course_materials/Mooc_Recommendation/recommendation_list/mooc_recommendation_list.py
````

## Main Steps

### Step 1: CourseMapper course embedding

```text
app/services/course_materials/Mooc_Recommendation/course_embedding/coursemapper_course_embedding.py
```

Generates and stores CourseMapper course embeddings.

### Step 2: MoocCentral course embedding

```text
app/services/course_materials/Mooc_Recommendation/course_embedding/mooccentral_course_embedding.py
```

Generates and stores MoocCentral course embeddings.

### Step 3: Learner model embedding

```text
app/services/course_materials/Mooc_Recommendation/learner_model/learner_model.py
```

Generates the current user's learner model embedding and stores it as:

```text
learner_model_embedding_MOOC
```

### Step 4: MOOC recommendation list

```text
app/services/course_materials/Mooc_Recommendation/recommendation_list/mooc_recommendation_list.py
```

Computes cosine similarity between the user embedding and course embeddings, then returns Top-20 recommended courses.

## Returned Result

The final result is returned from:

```python
get_MOOC_recommendations(job)
```

in:

```text
app/services/course_materials/course_materials.py
```

Returned value:

```python
return MOOC_recommendations
```

`MOOC_recommendations` is a Python list.
Each item in the list is a dictionary for one recommended course.

Example:

```python
[
    {
        "source": "CourseMapper",
        "score": 0.950947,
        "course_id": "...",
        "name": "...",
        "node_properties": {
            "cid": "...",
            "name": "..."
        }
    },
    {
        "source": "MoocCentral",
        "score": 0.620783,
        "course_id": "b34cca6404584a14b67feaf9bf18d332",
        "name": "Data Science Bootcamp",
        "institutions": [
            {
                "institution_id": "...",
                "name": "..."
            }
        ],
        "teachers": [
            {
                "teacher_id": "...",
                "name": "..."
            }
        ],
        "platforms": [
            {
                "platform_id": "...",
                "name": "..."
            }
        ],
        "node_properties": {
            "audience": "...",
            "certification": "...",
            "course_category": "...",
            "course_content": "...",
            "course_id": "...",
            "description": "...",
            "duration": "...",
            "goal": "...",
            "keywords": "...",
            "language": "...",
            "level": "...",
            "link": "...",
            "name": "...",
            "number_of_participants": "...",
            "prerequisites": "...",
            "price": "...",
            "rating": "...",
            "recommendations": "..."
        }
    }
]
```

## Printing

Readable terminal printing is implemented in:

```text
app/services/course_materials/Mooc_Recommendation/recommendation_list/mooc_recommendation_list.py
```

Method:

```python
MOOCRecommendationList.print_detailed_recommendations(recommendations)
```

This print function is only for debugging and demonstration.
It does not change the returned recommendation list.

```
```
