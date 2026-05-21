"""
MoocCube Learner Model Equation:
first, we show the entire equation, then we will explain each component in detail.
when we do the ablation study, we will remove one component at a time and see how it affects the performance of the model.

This file will use different functions to represent the different components of the learner model euqation.

When we construct variants of the learner model,
we can easyly remove one component by simply not including the corresponding componet function in the equation.

We will use two different relationship types.




### MoocCube Learner initial embedding equation:

e_initial_L = 1/N_enroll_L ∑ e_course_inital_c
where:
    N_enroll_L: is the number of courses that the learner L has enrolled in in the training set
    e_course_inital_c: is the initial embedding of the course c that the learner L has enrolled in the training set, 
                        which can get from the file: MoocCube_Evaluation/outputs/embeddings/course_initial_embedding.npy 
                        and MoocCube_Evaluation/outputs/embeddings/course_initial_id_to_index.json
    To confirm learner has which enrolled courses in the training set, 
    we can use the file: MoocCube_Evaluation/data/processed/processed_learner_training.json
    Note: we only use the courses that the learner has enrolled in the his training set to calculate the initial embedding of the learner.
  

### MoocCube Learner Model Entire equationwith two relationship types: learner-interest-concept and learner-enroll-course

We only use the enroled courses in the training set and interested concepts in the training set to calculate the learner model embedding.
MoocCube_Evaluation/outputs/train/user_concept_final_mapping.json and MoocCube_Evaluation/outputs/train/user_course_final_mapping.json are stored the training courses and training concepts for each learner, we can use these two files to confirm which courses and concepts the learner has in his training set.




e_L = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_k*e_final_k) + 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_c*e_final_c)]

where:
    k: is the neighbor nodes of the learner node L under relationship interest
    c: is the neighbor nodes of the learner node L under relationship enroll
    omega_interest_sum: is the sum of the weights of all the neighbor nodes under relationship interest
    omega_enroll_sum: is the sum of the weights of all the neighbor nodes under relationship enroll
    E_rel_interest: is the ramdomly generated weight relation matrix for relationship interest using glorot method, size is (embedding_dim, embedding_dim)
    E_rel_enroll: is the ramdomly generated weight relation matrix for relationship enroll using glorot method, size is (embedding_dim, embedding_dim)

    w_interest_k: is the weight of the neighbor node k under relationship interest

        for each neighbor node k under relationship interest, we calculate the weight w_interest_k using the following equation:
        w_interest_k = 1/number of weight componets (w_interest_(k,cos) + w_interest_(k,pos))
            where:
            w_interest_(k,cos) = cosine similarity between the concept name embedding and its source course initial embedding, 
                                we can get the concept name embedding from the file: MoocCube_Evaluation/outputs/embeddings/concept_name_embedding.npy 
                                and MoocCube_Evaluation/outputs/embeddings/concept_name_id_to_index.json, 
                                we can get the source course initial embedding from the file: MoocCube_Evaluation/outputs/embeddings/course_initial_embedding.npy 
                                and MoocCube_Evaluation/outputs/embeddings/course_initial_id_to_index.json, 
                                to confirm which source course the concept has, we can use the file: MoocCube_Evaluation/outputs/train/user_concept_final_mapping.json.
            w_interest_(k,pos) = i/(N-1)
                            where i is the position_time of concept k, i starts from 0, which means the most recent interested concept will have the highest position weight, and the least recent interested concept will have the lowest position weight,
                            we can get the position_time of concept k from the file: MoocCube_Evaluation/outputs/train/user_concept_final_mapping.json,
                            N is the total number of interested concepts that the learner L has in his training set,
                            we can use the file: MoocCube_Evaluation/outputs/train/user_concept_final_mapping.json to confirm how many interested concepts the learner has in his training set.
        when the interested concept number is 1, we will ignore the position component and only use the cosine similarity component to calculate the weight,
        so in this case, w_interest_k = w_interest_(k,cos).


    w_enroll_c: is the weight of the neighbor node c under relationship enroll

        for each neighbor node c under relationship enroll, we calculate the weight w_enroll_c using the following equation:
        w_enroll_c = 1/number of weight componets (w_enroll_(c,cos) + w_enroll_(c,pos))
            where:
            w_enroll_(c,cos) = cosine similarity between the course initial embedding and learner initial embedding, 
                                we can get the course initial embedding from the file: MoocCube_Evaluation/outputs/embeddings/course_initial_embedding.npy 
                                and MoocCube_Evaluation/outputs/embeddings/course_initial_id_to_index.json.
                                we can get the learner initial embedding from the the MoocCube Learner initial embedding equation.
            w_enroll_(c,pos) = i/(N-1)
                            where i is the position_time of course c, i starts from 0, which means the most recent enrolled course will have the highest position weight, and the least recent enrolled course will have the lowest position weight,
                            we can get the position_time of course c from the file: MoocCube_Evaluation/outputs/train/user_course_final_mapping.json,
                            N is the total number of enrolled courses that the learner L has in his training set,
                            we can use the file: MoocCube_Evaluation/outputs/train/user_course_final_mapping.json to confirm how many enrolled courses the learner has in his training set.
        when the enrolled course number is 1, we will ignore the position component and only use the cosine similarity component to calculate the weight,
        so in this case, w_enroll_c = w_enroll_(c,cos).


    e_final_k: is the embedding of the neighbor node k under relationship interest, 
                which can get from these two files: MoocCube_Evaluation/outputs/train/user_concept_final_mapping.json 
                and MoocCube_Evaluation/outputs/train/user_concept_initial_embedding.npy
    e_final_c: is the embedding of the neighbor node c under relationship enroll, 
                which can get from these two files: MoocCube_Evaluation/outputs/train/user_course_final_mapping.json 
                and MoocCube_Evaluation/outputs/train/user_course_initial_embedding.npy

Now, in MoocCube Learner Model, we have two relationship types: learner-interest-concept and learner-enroll-course,
when a learner has no interested concept in his training set, we will only use the enrolled courses to calculate the learner model embedding, 
and in this case, the equation will be:
e_L = 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_c*e_final_c)

because all learners have enrolled courses in their training set, we will not have the case that a learner has no enrolled course in his training set, so we will not have the case that we only use the interested concepts to calculate the learner model embedding.

"""

"""
variant 1: the entire learner model equation. If learner has no interested concept in his training set, we will only use the enrolled courses to calculate the learner model embedding.

            e_L = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_k*e_final_k) + 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_c*e_final_c)]

varient 2: remove the ramdomly generated weight relation matrix E_rel_interest for relationship interest, and E_rel_enroll for relationship enroll, which means we will not use the relation weights to calculate the learner model embedding.

            e_L = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * ( ∑ w_interest_k*e_final_k) + 1/(omega_enroll_sum) * ( ∑ w_enroll_c*e_final_c)]

varient 3: remove the weight w_interest_k for relationship interest, and w_enroll_c for relationship enroll, which means we will not use the neighbor node weights to calculate the learner model embedding.

            e_L = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ e_final_k) + 1/(omega_enroll_sum) * (E_rel_enroll ∑ e_final_c)]

            
variant 4: remove the position component w_interest_(k,pos) and w_enroll_(c,pos) in the weight calculation for relationship interest and relationship enroll, which means we will only use the cosine similarity component to calculate the neighbor node weights.

            e_L = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_(k,cos)*e_final_k) + 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_(c,cos)*e_final_c)]

variant 5: remove the cosine similarity component w_interest_(k,cos) and w_enroll_(c,cos) in the weight calculation for relationship interest and relationship enroll, which means we will only use the position component to calculate the neighbor node weights.

            e_L = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_(k,pos)*e_final_k) + 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_(c,pos)*e_final_c)]

variant 6: remove the 1/(omega_interest_sum + omega_enroll_sum) component in the equation, which means we will not normalize the final embedding of the learner by the sum of the relationship weights.

            e_L = [1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_k*e_final_k) + 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_c*e_final_c)]

variant 7: remove the 1/(omega_interest_sum + omega_enroll_sum) component and remove the ramdomly generated weight relation matrix E_rel_interest for relationship interest, and E_rel_enroll for relationship enroll.

            e_L = 1/(omega_interest_sum) * ( ∑ w_interest_k*e_final_k) + 1/(omega_enroll_sum) * ( ∑ w_enroll_c*e_final_c)

            
Note: please follow the equations!

Actually, special case is that:
  Learner has 1 course and 0 concept
  Learner has 1 course and multiple concepts

For each variant, if there is 0 interested concept in the learner's training set, we will only use the enrolled courses to calculate the learner model embedding. 
                    in this case, 
                    for variant 1, the equation will be:
                        e_L = 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_c*e_final_c)
                    for variant 2, the equation will be:
                        e_L = 1/(omega_enroll_sum) * ( ∑ w_enroll_c*e_final_c)
                    for variant 3, the equation will be:
                        e_L = 1/(omega_enroll_sum) * (E_rel_enroll ∑ e_final_c)
                    for variant 4, the equation will be:
                        e_L = 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_(c,cos)*e_final_c)
                    for variant 5, the equation will be:
                        e_L = 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_(c,pos)*e_final_c)
                    for variant 6, the equation will be:
                        e_L = (E_rel_enroll ∑ w_enroll_c*e_final_c)
                    for variant 7, the equation will be:
                        e_L = ( ∑ w_enroll_c*e_final_c)

Learner has 1 course and 0 concept:
                    for variant 1, the equation will be:
                        e_L = 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_(c,cos)*e_final_c) 
                            = 1/(w_enroll_(c,cos)) * (E_rel_enroll* w_enroll_(c,cos)*e_final_c) 
                            = E_rel_enroll*e_final_c

                    for variant 2, the equation will be:
                        e_L = 1/(omega_enroll_sum) * ( ∑ w_enroll_(c,cos)*e_final_c) 
                            = 1/(w_enroll_(c,cos)) * ( w_enroll_(c,cos)*e_final_c) 
                            = e_final_c

                    for variant 3, the equation will be:
                        e_L = 1/(omega_enroll_sum) * (E_rel_enroll ∑ e_final_c)  
                            = 1/(w_enroll_(c,cos)) * (E_rel_enroll* e_final_c) 

                    for variant 4, the equation will be:
                        e_L = 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_(c,cos)*e_final_c) 
                            = 1/(w_enroll_(c,cos)) * (E_rel_enroll* w_enroll_(c,cos)*e_final_c) 
                            = E_rel_enroll*e_final_c

                    for variant 5, the equation will be:
                        e_L = 1/(omega_enroll_sum) * (E_rel_enroll ∑ e_final_c) 
                            = 1/(w_enroll_(c,cos)) * (E_rel_enroll* e_final_c)

                    for variant 6, the equation will be:
                        e_L = (E_rel_enroll ∑ w_enroll_(c,cos)*e_final_c) 
                            = (E_rel_enroll* w_enroll_(c,cos)*e_final_c)

                    for variant 7, the equation will be:
                        e_L = ( ∑ w_enroll_(c,cos)*e_final_c) = ( w_enroll_(c,cos)*e_final_c)

Learner has 1 course and multiple concepts:
                    for variant 1, the equation will be:
                        e_L = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_k*e_final_k) + 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_(c,cos)*e_final_c)]
                            = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_k*e_final_k) + E_rel_enroll*e_final_c]
                    
                    for variant 2, the equation will be:
                        e_L = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * ( ∑ w_interest_k*e_final_k) + 1/(omega_enroll_sum) * ( ∑ w_enroll_(c,cos)*e_final_c)]
                            = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * ( ∑ w_interest_k*e_final_k) + e_final_c]

                    for variant 3, the equation will be:
                        e_L = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ e_final_k) + 1/(omega_enroll_sum) * (E_rel_enroll ∑ e_final_c)]
                            = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ e_final_k) + 1/(w_enroll_(c,cos)) * (E_rel_enroll* e_final_c)]
                        
                    for variant 4, the equation will be:
                        e_L = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_(k,cos)*e_final_k) + 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_(c,cos)*e_final_c)]
                            = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_(k,cos)*e_final_k) + E_rel_enroll*e_final_c]
                        
                    for variant 5, the equation will be:
                        e_L = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_(k,pos)*e_final_k) + 1/(omega_enroll_sum) * (E_rel_enroll ∑ e_final_c)]    
                            = 1/(omega_interest_sum + omega_enroll_sum)[1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_(k,pos)*e_final_k) + 1/(w_enroll_(c,cos)) * (E_rel_enroll* e_final_c)]
                        
                    for variant 6, the equation will be:
                        e_L = 1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_k*e_final_k) + 1/(omega_enroll_sum) * (E_rel_enroll ∑ w_enroll_(c,cos)*e_final_c)
                            = 1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_k*e_final_k) + 1/(w_enroll_(c,cos))* (E_rel_enroll* w_enroll_(c,cos)*e_final_c)
                            = 1/(omega_interest_sum) * (E_rel_interest ∑ w_interest_k*e_final_k) + (E_rel_enroll* e_final_c)
                        
                    for variant 7, the equation will be:
                        e_L = 1/(omega_interest_sum) * ( ∑ w_interest_k*e_final_k) + 1/(omega_enroll_sum) * ( ∑ w_enroll_(c,cos)*e_final_c)
                            = 1/(omega_interest_sum) * ( ∑ w_interest_k*e_final_k) + 1/(w_enroll_(c,cos)) * ( w_enroll_(c,cos)*e_final_c)
                            = 1/(omega_interest_sum) * ( ∑ w_interest_k*e_final_k) + e_final_c

"""

"""


The user's test courses can be found in the file `MoocCube_Evaluation/data/processed/processed_user.json`.
For each user's test course, we generate 99 negative sample courses (i.e., courses the user has not interacted with).
If a user has multiple test courses, we generate 99 negative sample courses for each test course.
Finally, for the user's overall negative sample course set, we remove duplicates, obtaining a unique set of negative sample courses.
We treat each course in the user's test set as a ground-truth positive sample and sort them together with the courses in the user's negative sample course set to obtain the position of each test course in this ranking.
We use learner model embedding and course initial embedding to calculate the similarity score between users and courses, and then sort them.
We obtain a top-K recommended course list, calculate HR@K and NDCG@K for each user, and summarize them to obtain the global metric.
Where K = 5, 10, 20.

Note: We only generate one top-k recommendation list for each user.


HR@K,NDSCG@K：
- HR@K equation1 (ground-truth level): HR@K = Σ_u Hits_u@K / |GT|
- HR@K equation2 (user level):         HR@K = (1/U) Σ_u I(|R_u ∩ T_u| > 0)
- NDCG@K:                              NDCG@K = (1/U) Σ_u (DCG_u@K / IDCG_u@K)

- HR@K equation1: ground-truth level aggregation
- HR@K equation2: user-level hit indicator average
- NDCG@K: normalized discounted cumulative gain (binary relevance)




"""