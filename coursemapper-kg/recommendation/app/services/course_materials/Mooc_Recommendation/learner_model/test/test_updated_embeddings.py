# type this command to run this file:
# pipenv run python -m app.services.course_materials.Mooc_Recommendation.learner_model.test.test_updated_embeddings

import numpy as np
from ..updated_embeddings import ConceptEmbeddingUpdater


concept_info = {
    "C1": {
        "unupdated_embedding": np.array([0.1, 0.2, 0.3, 0.4]),
        "weight": 1.0,
        "timestamp": None,
        "position_weight": 0.0,
        "position_time": 0,
        "relationship": "dnu"
    },
    "C2": {
        "unupdated_embedding": np.array([0.2, 0.3, 0.4, 0.5]),
        "weight": 1.0,
        "timestamp": None,
        "position_weight": 0.5,
        "position_time": 1,
        "relationship": "dnu"
    },
    "C3": {
        "unupdated_embedding": np.array([0.3, 0.4, 0.5, 0.6]),
        "weight": 1.0,
        "timestamp": None,
        "position_weight": 1.0,
        "position_time": 2,
        "relationship": "dnu"
    }
}

updater = ConceptEmbeddingUpdater()
concept_info, corr, mask, seq, updated = updater.update_embeddings(concept_info, debug=True)

print("\nCorrelation Matrix")
print(corr)

print("\nMask Matrix")
print(mask)

print("\nSequential Matrix")
print(seq)

print("\nUpdated Embedding Matrix")
print(updated)

print("\nUpdated concept_info")
for cid, info in concept_info.items():
    print(cid, info["updated_embedding"])