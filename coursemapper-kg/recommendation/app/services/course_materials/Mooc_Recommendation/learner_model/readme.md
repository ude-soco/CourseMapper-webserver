Overall Learner Model Equation Pipeline
---------------------------------------

This project implements the learner model equation in several files.

1. relationship_info.py
   - Collect raw relation-specific information for each learner.
   - For each relation type, retrieve neighbor nodes, embeddings, weights, and timestamps.
   - Output relation_info dictionaries for dnu, INTERESTED_IN, and ENGAGED_IN.

2. updated_embeddings.py
   - Take the relation_info dictionaries as input.
   - Update each neighbor node embedding under its relation.
   - Add "updated_embedding" to each node in the relation_info dictionary.

3. relation_components.py
   - Take the updated relation_info dictionary as input.
   - Compute the relation component for one relationship type.
   - The computed component is:

        (1 / ω_sum) * Σ(ω_c * e_c)

     In this file, the function computes:
        ω_sum
        Σ(ω_c * e_c)

     The final division by ω_sum can be handled later in learner_model.py.

4. learner_model.py
   - Combine all relation components.
   - Apply relation-specific transformation matrices.
   - Compute the final learner embedding.
