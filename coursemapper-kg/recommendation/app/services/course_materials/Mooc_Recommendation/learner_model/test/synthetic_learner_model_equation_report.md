---
# Synthetic Learner Model Equation Trace
- user_id: `synthetic_user_001`
- embedding_dim: `4`
- data_source: `synthetic / no database query`

This file uses a fake user with:
- 3 DNU concept interactions
- 5 INTERESTED_IN concept interactions
- 3 ENGAGED_IN course interactions with level = low / medium / high

## Relation: dnu
- relation_name: `dnu`
- concept_count: `3`
- ignore_position: `False`

### Raw input
| id | weight | timestamp | position_time | position_weight | embedding |
|---|---:|---|---:|---:|---|
| dnu_concept_1 | 1.0000 | 2026-03-01 09:00:00 | 0 | 0.0000 | `[0.100000, 0.200000, 0.300000, 0.400000]` |
| dnu_concept_2 | 0.8000 | 2026-03-03 09:00:00 | 1 | 0.5000 | `[0.200000, 0.100000, 0.000000, 0.500000]` |
| dnu_concept_3 | 0.6000 | 2026-03-05 09:00:00 | 2 | 1.0000 | `[0.300000, 0.400000, 0.100000, 0.200000]` |

### Updated embedding details
#### dnu_concept_1
- relation weight formula: `ω_dnu_concept_1 = (1.0000 + 0.0000) / 2 = 0.5000`
- updated_embedding(dnu_concept_1) = `[0.480000, 0.573333, 0.373333, 0.946667]`
- weighted term: `0.5000 × [0.480000, 0.573333, 0.373333, 0.946667] = [0.240000, 0.286667, 0.186667, 0.473333]`

#### dnu_concept_2
- relation weight formula: `ω_dnu_concept_2 = (0.8000 + 0.5000) / 2 = 0.6500`
- updated_embedding(dnu_concept_2) = `[0.400000, 0.366667, 0.066667, 0.633333]`
- weighted term: `0.6500 × [0.400000, 0.366667, 0.066667, 0.633333] = [0.260000, 0.238333, 0.043333, 0.411667]`

#### dnu_concept_3
- relation weight formula: `ω_dnu_concept_3 = (0.6000 + 1.0000) / 2 = 0.8000`
- updated_embedding(dnu_concept_3) = `[0.300000, 0.400000, 0.100000, 0.200000]`
- weighted term: `0.8000 × [0.300000, 0.400000, 0.100000, 0.200000] = [0.240000, 0.320000, 0.080000, 0.160000]`

### Relation component
- relation_weight_sum = `1.9500`
- weighted_embedding_sum = `[0.740000, 0.845000, 0.310000, 1.045000]`
- relation_component = weighted_embedding_sum / relation_weight_sum = `[0.379487, 0.433333, 0.158974, 0.535897]`
- W_rel_dnu =
```text
[[1. 0. 0. 0.]
 [0. 1. 0. 0.]
 [0. 0. 1. 0.]
 [0. 0. 0. 1.]]
```

## Relation: interest
- relation_name: `INTERESTED_IN`
- concept_count: `5`
- ignore_position: `False`

### Raw input
| id | weight | timestamp | position_time | position_weight | embedding |
|---|---:|---|---:|---:|---|
| interest_concept_1 | 0.9000 | 2026-03-02 10:00:00 | 0 | 0.0000 | `[0.500000, 0.100000, 0.200000, 0.000000]` |
| interest_concept_2 | 0.7000 | 2026-03-04 10:00:00 | 1 | 0.2500 | `[0.200000, 0.300000, 0.400000, 0.100000]` |
| interest_concept_3 | 0.8000 | 2026-03-04 10:00:00 | 1 | 0.2500 | `[0.600000, 0.200000, 0.100000, 0.200000]` |
| interest_concept_4 | 0.4000 | 2026-03-06 10:00:00 | 2 | 0.5000 | `[0.100000, 0.500000, 0.200000, 0.300000]` |
| interest_concept_5 | 0.6000 | 2026-03-08 10:00:00 | 3 | 0.7500 | `[0.300000, 0.200000, 0.500000, 0.400000]` |

### Updated embedding details
#### interest_concept_1
- relation weight formula: `ω_interest_concept_1 = (0.9000 + 0.0000) / 2 = 0.4500`
- updated_embedding(interest_concept_1) = `[1.437393, 0.833884, 0.989805, 0.646189]`
- weighted term: `0.4500 × [1.437393, 0.833884, 0.989805, 0.646189] = [0.646827, 0.375248, 0.445412, 0.290785]`

#### interest_concept_2
- relation weight formula: `ω_interest_concept_2 = (0.7000 + 0.2500) / 2 = 0.4750`
- updated_embedding(interest_concept_2) = `[0.942105, 1.018819, 1.076251, 0.833987]`
- weighted term: `0.4750 × [0.942105, 1.018819, 1.076251, 0.833987] = [0.447500, 0.483939, 0.511219, 0.396144]`

#### interest_concept_3
- relation weight formula: `ω_interest_concept_3 = (0.8000 + 0.2500) / 2 = 0.5250`
- updated_embedding(interest_concept_3) = `[1.000932, 0.824407, 0.830863, 0.721192]`
- weighted term: `0.5250 × [1.000932, 0.824407, 0.830863, 0.721192] = [0.525489, 0.432814, 0.436203, 0.378626]`

#### interest_concept_4
- relation weight formula: `ω_interest_concept_4 = (0.4000 + 0.5000) / 2 = 0.4500`
- updated_embedding(interest_concept_4) = `[0.328802, 0.652535, 0.581337, 0.605070]`
- weighted term: `0.4500 × [0.328802, 0.652535, 0.581337, 0.605070] = [0.147961, 0.293641, 0.261602, 0.272281]`

#### interest_concept_5
- relation weight formula: `ω_interest_concept_5 = (0.6000 + 0.7500) / 2 = 0.6750`
- updated_embedding(interest_concept_5) = `[0.300000, 0.200000, 0.500000, 0.400000]`
- weighted term: `0.6750 × [0.300000, 0.200000, 0.500000, 0.400000] = [0.202500, 0.135000, 0.337500, 0.270000]`

### Relation component
- relation_weight_sum = `2.5750`
- weighted_embedding_sum = `[1.970277, 1.720641, 1.991936, 1.607835]`
- relation_component = weighted_embedding_sum / relation_weight_sum = `[0.765156, 0.668210, 0.773567, 0.624402]`
- W_rel_interest =
```text
[[0.8 0.1 0.  0. ]
 [0.  0.9 0.1 0. ]
 [0.  0.  1.  0.1]
 [0.1 0.  0.  0.9]]
```

## Relation: engagement
- relation_name: `ENGAGED_IN`
- concept_count: `3`
- ignore_position: `False`

### Raw input
| id | weight | timestamp | position_time | position_weight | embedding |
|---|---:|---|---:|---:|---|
| course_1 (low) | 0.2000 | 2026-03-01 20:00:00 | 0 | 0.0000 | `[0.400000, 0.200000, 0.100000, 0.300000]` |
| course_2 (medium) | 0.3000 | 2026-03-07 20:00:00 | 1 | 0.5000 | `[0.200000, 0.600000, 0.300000, 0.100000]` |
| course_3 (high) | 0.5000 | 2026-03-09 20:00:00 | 2 | 1.0000 | `[0.700000, 0.100000, 0.400000, 0.200000]` |

### Updated embedding details
#### course_1
- relation weight formula: `ω_course_1 = (0.2000 + 0.0000) / 2 = 0.1000`
- updated_embedding(course_1) = `[1.145274, 0.690077, 0.650544, 0.541706]`
- weighted term: `0.1000 × [1.145274, 0.690077, 0.650544, 0.541706] = [0.114527, 0.069008, 0.065054, 0.054171]`

#### course_2
- relation weight formula: `ω_course_2 = (0.3000 + 0.5000) / 2 = 0.4000`
- updated_embedding(course_2) = `[0.602293, 0.657470, 0.529882, 0.214941]`
- weighted term: `0.4000 × [0.602293, 0.657470, 0.529882, 0.214941] = [0.240917, 0.262988, 0.211953, 0.085976]`

#### course_3
- relation weight formula: `ω_course_3 = (0.5000 + 1.0000) / 2 = 0.7500`
- updated_embedding(course_3) = `[0.700000, 0.100000, 0.400000, 0.200000]`
- weighted term: `0.7500 × [0.700000, 0.100000, 0.400000, 0.200000] = [0.525000, 0.075000, 0.300000, 0.150000]`

### Relation component
- relation_weight_sum = `1.2500`
- weighted_embedding_sum = `[0.880445, 0.406996, 0.577007, 0.290147]`
- relation_component = weighted_embedding_sum / relation_weight_sum = `[0.704356, 0.325597, 0.461606, 0.232118]`
- W_rel_engagement =
```text
[[1.  0.  0.1 0. ]
 [0.  1.  0.  0.1]
 [0.1 0.  1.  0. ]
 [0.  0.1 0.  1. ]]
```

## Final learner model equation
`E_learner = (dnu_term + interest_term + engagement_term) / (ω_dnu_sum + ω_interest_sum + ω_engagement_sum)`
- ω_dnu_sum = `1.9500`
- ω_interest_sum = `2.5750`
- ω_engagement_sum = `1.2500`
- ω_total = `5.7750`
- dnu_term = `W_rel_dnu × relation_component_dnu = [0.379487, 0.433333, 0.158974, 0.535897]`
- interest_term = `W_rel_interest × relation_component_interest = [0.678946, 0.678746, 0.836008, 0.638478]`
- engagement_term = `W_rel_engagement × relation_component_engagement = [0.750516, 0.348809, 0.532041, 0.264677]`
- final learner embedding = `([0.379487, 0.433333, 0.158974, 0.535897] + [0.678946, 0.678746, 0.836008, 0.638478] + [0.750516, 0.348809, 0.532041, 0.264677]) / 5.7750 = [0.313238, 0.252968, 0.264420, 0.249187]`

### Final embedding (full)
```text
0.3132380029,0.2529675553,0.2644196111,0.2491865345
```

