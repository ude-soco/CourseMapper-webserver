import numpy as np

from config import EMBEDDING_DIM, USER_COURSE_FINAL_EMBEDDING_PATH, USER_CONCEPT_FINAL_EMBEDDING_PATH
from enroll_relationship_dict_10 import build_user_enroll_relation_dict
from interest_relationship_dict_11 import build_user_interest_relation_dict

try:
    from utils import glorot_seed

    def build_random_matrix():
        """
        Build one Glorot-initialized random matrix.
      
        """
        return glorot_seed((EMBEDDING_DIM, EMBEDDING_DIM)).numpy().astype(np.float32)
except Exception:
    def build_random_matrix():
        """
        Fallback random matrix builder when glorot_seed is unavailable.
        
        """
        rng = np.random.default_rng()
        limit = np.sqrt(6.0 / (EMBEDDING_DIM + EMBEDDING_DIM))
        return rng.uniform(-limit, limit, size=(EMBEDDING_DIM, EMBEDDING_DIM)).astype(np.float32)


"""
This file follows a two-layer design.

Layer 1: prepare all reusable relation components.

Layer 2: define each variant by a short configuration table.


Main idea:

1. Complex edge cases are handled only once when preparing components.
   
2. Each variant only says which component it uses and which switches are turned on.


"""


# Build two fixed random matrices for the two relationships.

W_ENROLL = build_random_matrix()
W_INTEREST = build_random_matrix()


# Variant definition table.

# component:
# - direct_sum:            Σ e
# - node_weight_sum:       Σ (node_weight * e)
# - first_weight_sum:      Σ (first_weight_component * e)
# - position_weight_sum:   Σ (position_weight * e)
#
# use_random_matrix:
# - True  means multiplying the relation term by W.
# - False means removing W from the formula.
#
# use_relation_normalization:
# - True  means dividing each relation term by its own relation_weight_sum.
# - False means removing the inner normalization.
#
# use_outer_normalization:
# - True  means dividing the sum of two relation terms by
#          (enroll_relation_weight_sum + interest_relation_weight_sum),
#          but only when both relationships exist.
# - False means removing the outer normalization.
VARIANT_TABLE = {
    1: {
        "component": "node_weight_sum",
        "use_random_matrix": True,
        "use_relation_normalization": True,
        "use_outer_normalization": True,
    },
    2: {
        "component": "node_weight_sum",
        "use_random_matrix": False,
        "use_relation_normalization": True,
        "use_outer_normalization": True,
    },
    3: {
        "component": "direct_sum",
        "use_random_matrix": True,
        "use_relation_normalization": True,
        "use_outer_normalization": True,
    },
    4: {
        "component": "first_weight_sum",
        "use_random_matrix": True,
        "use_relation_normalization": True,
        "use_outer_normalization": True,
    },
    5: {
        "component": "position_weight_sum",
        "use_random_matrix": True,
        "use_relation_normalization": True,
        "use_outer_normalization": True,
    },
    6: {
        "component": "node_weight_sum",
        "use_random_matrix": True,
        "use_relation_normalization": False,
        "use_outer_normalization": False,
    },
    7: {
        "component": "node_weight_sum",
        "use_random_matrix": False,
        "use_relation_normalization": False,
        "use_outer_normalization": False,
    },
}


# Step 1: Prepare relation components.

def prepare_one_relation_components(relation_dict, relation_name, final_embeddings, final_index_key):
    """
    Prepare all reusable components for one relationship.
    
    The output keeps both summary information and four weighted sums.

    Returned fields:
   
    - exists                : whether this relationship has any node
            
    - node_count            : number of nodes in this relationship
                            
    - ignore_position       : copied from the dictionary summary
                              
    - relation_weight_sum   : copied from the dictionary summary
                             
    - direct_sum            : Σ e
    - node_weight_sum       : Σ (node_weight * e)
    - first_weight_sum      : Σ (first_weight_component * e)
    - position_weight_sum   : Σ (position_weight * e)
    """
    summary = relation_dict[relation_name]["summary"]
    nodes = relation_dict[relation_name]["nodes"]

    components = {
        "exists": summary["node_count"] > 0,
        "node_count": int(summary["node_count"]),
        "ignore_position": bool(summary["ignore_position"]),
        "relation_weight_sum": float(summary["relation_weight_sum"]),
        "direct_sum": np.zeros(EMBEDDING_DIM, dtype=np.float32),
        "node_weight_sum": np.zeros(EMBEDDING_DIM, dtype=np.float32),
        "first_weight_sum": np.zeros(EMBEDDING_DIM, dtype=np.float32),
        "position_weight_sum": np.zeros(EMBEDDING_DIM, dtype=np.float32),
    }

    if not components["exists"]:
        return components

    for node_id in nodes:
        info = nodes[node_id]
        emb_idx = int(info[final_index_key])
        emb = final_embeddings[emb_idx].astype(np.float32)

        components["direct_sum"] += emb
        components["node_weight_sum"] += float(info["node_weight"]) * emb
        components["first_weight_sum"] += float(info["first_weight_component"]) * emb
        components["position_weight_sum"] += float(info["position_weight"]) * emb

    return components


# Step 2: Prepare both ENROLL and INTEREST components for one user.

def prepare_variant_components(user_id):
    """
    Build the two relationship dictionaries and transform them into reusable components.


    After this step, later variant functions no longer need to scan nodes again.

    """
    enroll_dict = build_user_enroll_relation_dict(user_id)
    interest_dict = build_user_interest_relation_dict(user_id)

    enroll_final_embeddings = np.load(USER_COURSE_FINAL_EMBEDDING_PATH).astype(np.float32)
    interest_final_embeddings = np.load(USER_CONCEPT_FINAL_EMBEDDING_PATH).astype(np.float32)

    enroll_components = prepare_one_relation_components(
        relation_dict=enroll_dict,
        relation_name="ENROLL",
        final_embeddings=enroll_final_embeddings,
        final_index_key="course_final_embedding_index",
    )

    interest_components = prepare_one_relation_components(
        relation_dict=interest_dict,
        relation_name="INTEREST",
        final_embeddings=interest_final_embeddings,
        final_index_key="concept_final_embedding_index",
    )

    return {
        "enroll": enroll_components,
        "interest": interest_components,
    }


# Step 3: Pick one component for one relationship.

def choose_component_vector(relation_components, component_name):
    """
    Select the component vector for one relationship.


    Special rule for Variant 5:

    - Variant 5 normally uses position_weight_sum.

    - But if the dictionary summary says ignore_position = True,
      then this relationship degenerates to direct_sum.
   

    This degeneration is decided per relationship, not globally.

    """
    if component_name == "position_weight_sum" and relation_components["ignore_position"]:
        return relation_components["direct_sum"]
    return relation_components[component_name]


# Step 4: Build one relation term under the current variant setting.

def build_one_relation_term(relation_components, matrix, setting):
    """
    Build the term of one relationship under one variant.
  
    Formula order:
  
    1. choose the required component
  
    2. optionally apply inner normalization

    3. optionally multiply by the random matrix

    """
    if not relation_components["exists"]:
        return np.zeros(EMBEDDING_DIM, dtype=np.float32)

    term = choose_component_vector(relation_components, setting["component"]).copy()

    if setting["use_relation_normalization"]:
        relation_weight_sum = relation_components["relation_weight_sum"]
        if relation_weight_sum != 0:
            term = term / relation_weight_sum

    if setting["use_random_matrix"]:
        term = matrix.dot(term)

    return term.astype(np.float32)


# Step 5: Merge the two relationship terms.

def combine_two_relation_terms(enroll_term, interest_term, enroll_components, interest_components, setting):
    """
    Combine ENROLL and INTEREST into the final learner embedding.
 

    Rules:
  
    1. If neither relationship exists, return a zero vector.
       
    2. If only one relationship exists, use only that relationship term.
       If this happens, do not apply the outer normalization.
       
    
    3. If both relationships exist:
       - add the two terms
       - optionally apply the outer normalization
    
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
        total_weight_sum = (
            enroll_components["relation_weight_sum"] +
            interest_components["relation_weight_sum"]
        )
        if total_weight_sum != 0:
            final_embedding = final_embedding / total_weight_sum

    return final_embedding.astype(np.float32)


# Step 6: Build one user embedding under one variant.

def build_user_variant_embedding(user_id, variant_id):
    """
    Build the learner embedding of one user under one variant.
   

    This is the main function you will most likely call later.

    """
    if variant_id not in VARIANT_TABLE:
        raise ValueError(f"Unsupported variant_id: {variant_id}")

    setting = VARIANT_TABLE[variant_id]
    components = prepare_variant_components(user_id)

    enroll_term = build_one_relation_term(
        relation_components=components["enroll"],
        matrix=W_ENROLL,
        setting=setting,
    )
    interest_term = build_one_relation_term(
        relation_components=components["interest"],
        matrix=W_INTEREST,
        setting=setting,
    )

    final_embedding = combine_two_relation_terms(
        enroll_term=enroll_term,
        interest_term=interest_term,
        enroll_components=components["enroll"],
        interest_components=components["interest"],
        setting=setting,
    )
    return final_embedding


# Step 7: Build all seven variant embeddings for one user.

def build_all_variants_for_one_user(user_id):
    """
    Return all seven learner embeddings for one user.
  
    """
    outputs = {}
    for variant_id in range(1, 8):
        outputs[f"variant_{variant_id}"] = build_user_variant_embedding(user_id, variant_id)
    return outputs
