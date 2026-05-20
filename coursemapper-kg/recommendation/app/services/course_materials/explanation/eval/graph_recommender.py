from __future__ import annotations

import copy
from typing import Any, Dict, List, Sequence

import numpy as np
from bson import ObjectId
from pymongo import MongoClient

from config import Config
from app.log import LOG
from .in_memory_kg import InMemoryKG

logger = LOG(name=__name__)


class GraphRecommender:

    # Serialize embedding array to a comma-separated string
    @staticmethod
    def embedding_to_str(embedding: np.ndarray) -> str:
        return ",".join(str(float(x)) for x in np.asarray(embedding, dtype=np.float32))

    # Wrap a user embedding in the recommender's expected schema
    @staticmethod
    def build_fake_user(user_embedding: np.ndarray) -> List[Dict[str, Any]]:
        return [{"u": {"embedding": GraphRecommender.embedding_to_str(user_embedding)}}]

    # Deep-copy candidates and inject latest embeddings from the KG
    @staticmethod
    def inject_current_embeddings_into_candidates(
        candidates: Sequence[Dict[str, Any]],
        final_embeddings: np.ndarray,
        kg: InMemoryKG,
    ) -> List[Dict[str, Any]]:
        copied = copy.deepcopy(list(candidates))
        for item in copied:
            cid = str(item["n"]["cid"])
            if cid not in kg.id_to_node_idx:
                continue
            idx = kg.id_to_node_idx[cid]
            item["n"]["final_embedding"] = GraphRecommender.embedding_to_str(final_embeddings[idx])
        return copied

    # Convert sequence output into a ranked list with aggregate scores
    @staticmethod
    def sequence_output_to_rankings(sequence_output: Dict[str, Any]) -> List[Dict[str, Any]]:
        result = []
        for group in sequence_output.get("nodes", []):
            data = group.get("data", [])
            if not data:
                continue
            sequence = tuple(str(item["cid"]) for item in data if item.get("cid") is not None)
            score = float(sum(float(item.get("score") or 0.0) for item in data))
            result.append(
                {
                    "sequence": sequence,
                    "score": score,
                    "data": data,
                }
            )
        return result

    # Fetch the user document from MongoDB
    @staticmethod
    def _get_user_doc(user_id: str) -> Dict[str, Any] | None:
        client = None
        try:
            # connect to MongoDB
            client = MongoClient(Config.MONGO_DB_URI)
            db = client[Config.MONGO_DB_NAME]  # the name of database
            users_collection = db["users"]  # the name of table
            user_doc = users_collection.find_one({"_id": ObjectId(user_id)})
            return user_doc
        except Exception as e:
            logger.warning(f"_get_user_doc failed: user_id={user_id}, err={e}")
            return None
        finally:
            try:
                if client is not None:
                    client.close()
            except Exception:
                pass

    # Reconstruct user embedding from DNU concepts with temporal weighting
    @staticmethod
    def build_user_embedding(
        final_embeddings: np.ndarray,
        kg: InMemoryKG,
        user_id: str,
        mid: str,
        dnu_cids: Sequence[str],
        dnu_weights: Dict[str, float],
    ) -> np.ndarray:
        if final_embeddings.size == 0:
            return np.zeros((0,), dtype=np.float32)

        user_doc = GraphRecommender._get_user_doc(user_id)
        concept_timestamps = {}
        default_timestamp = None
        if user_doc and "conceptTimestamps" in user_doc and len(user_doc["conceptTimestamps"]) > 0:
            concept_timestamps = user_doc["conceptTimestamps"]
            default_timestamp = next(iter(concept_timestamps.values()))

        valid_dnu_cids = [str(cid) for cid in dnu_cids if str(cid) in kg.id_to_node_idx]

        if not valid_dnu_cids:
            return np.zeros(final_embeddings.shape[1], dtype=np.float32)

        embeddings = []
        for cid in valid_dnu_cids:
            idx = kg.id_to_node_idx[cid]
            embeddings.append(
                {
                    "dnu_concept_id": cid,
                    "embedding": GraphRecommender.embedding_to_str(final_embeddings[idx]),
                    "weight": float(dnu_weights.get(cid, 0.0)),
                }
            )

        if len(embeddings) == 1:
            # Single DNU concept -> weighted embedding directly
            sum_embeddings = 0
            sum_weights = 0
            for embedding in embeddings:
                list1 = embedding["embedding"].split(",")
                list2 = []
                for j in list1:
                    list2.append(float(j))
                arr = np.array(list2)
                sum_embeddings = sum_embeddings + arr * embedding["weight"]
                sum_weights = sum_weights + embedding["weight"]
            average = np.divide(sum_embeddings, sum_weights)
            return np.asarray(average, dtype=np.float32)

        dnu_concept_mid = {}
        dnu_concept_ids_list = []
        for embedding in embeddings:
            dnu_concept_ids = embedding["dnu_concept_id"]
            dnu_concept_ids_list.append(dnu_concept_ids)
            list1 = embedding["embedding"].split(",")
            list2 = []
            for j in list1:
                list2.append(float(j))
            arr = np.array(list2)
            dnu_concept_mid[dnu_concept_ids] = {
                "embedding": arr,
                "weight": embedding["weight"],
            }

        filtered_timestamps = {
            id_: concept_timestamps.get(id_, default_timestamp) if concept_timestamps else default_timestamp
            for id_ in dnu_concept_ids_list
        }
        sorted_timestamps = sorted(filtered_timestamps.items(), key=lambda x: x[1])
        dnu_position = {id_: position for position, (id_, _) in enumerate(sorted_timestamps)}

        embeddings_arr = [np.array(dnu_concept_mid[node]["embedding"]) for node in dnu_concept_ids_list]
        num_nodes = len(dnu_concept_ids_list)
        dnu_weight_matrix = np.zeros((num_nodes, num_nodes))
        for i in range(num_nodes):
            for j in range(num_nodes):
                if i == j:
                    dnu_weight_matrix[i][j] = 1.0
                else:
                    # Cosine similarity between DNU embeddings
                    dot_product = np.dot(embeddings_arr[i], embeddings_arr[j])
                    norm_i = np.linalg.norm(embeddings_arr[i])
                    norm_j = np.linalg.norm(embeddings_arr[j])
                    if norm_i == 0 or norm_j == 0:
                        dnu_weight_matrix[i][j] = 0.0
                    else:
                        dnu_weight_matrix[i][j] = dot_product / (norm_i * norm_j)

        positions = [dnu_position[node] for node in dnu_concept_ids_list]
        mask_matrix = np.zeros((num_nodes, num_nodes))
        for i in range(num_nodes):
            for j in range(num_nodes):
                if positions[i] <= positions[j]:
                    mask_matrix[i][j] = 0
                else:
                    # Mask future positions to enforce sequence direction
                    mask_matrix[i][j] = -10

        sequential_matrix = np.where(mask_matrix == -10, 0, dnu_weight_matrix + mask_matrix)
        embedding_matrix = np.vstack(embeddings_arr)
        new_dnu_embeddings = np.dot(sequential_matrix, embedding_matrix)

        for idx, concept_id in enumerate(dnu_concept_ids_list):
            dnu_concept_mid[concept_id]["embedding"] = new_dnu_embeddings[idx]

        dnu_ids = list(dnu_concept_mid.keys())
        dnu_embeddings = [dnu_concept_mid[id]["embedding"] for id in dnu_ids]
        weights = [dnu_concept_mid[id]["weight"] for id in dnu_ids]
        dnu_positions = [dnu_position[id] for id in dnu_ids]

        w_c_list = []
        for i in range(num_nodes):
            W_cos = weights[i]
            if num_nodes == 1:
                W_pos = 0
            else:
                W_pos = dnu_positions[i] / (num_nodes - 1)
            # Combine similarity and positional weights
            w_c = 0.5 * (W_cos + W_pos)
            w_c_list.append(w_c)

        W_sum = sum(w_c_list)
        if W_sum == 0:
            return np.zeros_like(dnu_embeddings[0], dtype=np.float32)

        embeddings_sum = np.zeros_like(dnu_embeddings[0])
        for i in range(num_nodes):
            # Weighted sum of DNU embeddings
            embeddings_sum += w_c_list[i] * dnu_embeddings[i]
        e_L = embeddings_sum / W_sum
        return np.asarray(e_L, dtype=np.float32)