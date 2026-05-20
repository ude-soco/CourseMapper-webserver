from __future__ import annotations

import os
import tempfile
from contextlib import contextmanager
from typing import Any, Dict, List

import numpy as np

from config import Config
from app.log import LOG
from ...GCN.gcn import GCN
from ...GCN.lightGCN import LightGCN
from ...Relational_ConceptGCN.relational_conceptgcn_rrgcn import RRGCN
from ...Relational_ConceptGCN.relational_conceptgcn_compgcn import relational_conceptgcn_compgcn
from ...db.neo4_db import NeoDataBase
from .in_memory_kg import InMemoryKG

logger = LOG(name=__name__)

# Temporarily change working directory and restore it afterward
@contextmanager
def _pushd(path: str):
    old = os.getcwd()
    os.chdir(path)
    try:
        yield
    finally:
        os.chdir(old)

# Convert an embedding array to a comma-separated string
def _embedding_to_str(embedding: Any) -> str:
    arr = np.asarray(embedding, dtype=np.float32).reshape(-1)
    return ",".join(str(float(x)) for x in arr)

# Read node ID ordering from idfeature.txt (as strings)
def _read_id_order_from_idfeature() -> List[str]:
    idx_features = np.genfromtxt("idfeature.txt", dtype=np.dtype(str))
    if idx_features.ndim == 1:
        idx_features = np.expand_dims(idx_features, axis=0)
    return [str(x) for x in idx_features[:, 1]]

# Read the first newid entry from idfeature.txt for fallback use
def _read_first_newid_from_idfeature() -> str:
    idx_features = np.genfromtxt("idfeature.txt", dtype=np.dtype(str))
    if idx_features.ndim == 1:
        idx_features = np.expand_dims(idx_features, axis=0)
    return str(idx_features[0, 0])

# Ensure edge file has at least two lines to keep np.genfromtxt 2D
def _ensure_edge_file_2d(filepath: str, fallback_newid: str):
    lines = []

    if os.path.exists(filepath):
        try:
            with open(filepath, "r", encoding="utf-8") as f:
                lines = [line.strip() for line in f.readlines() if line.strip()]
        except Exception:
            lines = []

    if len(lines) == 0:
        filler = f"{fallback_newid} 0 {fallback_newid}"
        lines = [filler, filler]
    elif len(lines) == 1:
        lines = [lines[0], lines[0]]

    with open(filepath, "w", encoding="utf-8") as f:
        f.write("\n".join(lines) + "\n")

 # Return empty Neo4j-style result set
class _DummyRunResult:
    def data(self):
        return []


class _ListRunResult:
    def __init__(self, rows: List[Dict[str, Any]]):
        self._rows = rows

    # Return captured rows as Neo4j-style data()
    def data(self):
        return self._rows

# Use memory KG to emulate the session.run(...).data() required by the original NeoDataBase.idfeature()/relation()
class _KGExportSession:

    def __init__(self, kg: InMemoryKG):
        self.kg = kg

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    # Emulate Neo4j queries used by extract_vector_relation()
    def run(self, query: str, **params):
        q = " ".join(query.split())

        if "MATCH (n:Concept) where n.mid = $mid RETURN n.initial_embedding as embedding, n.cid as id, n.type as type" in q:
            # Return concept nodes (non-slide) with initial embeddings
            rows = []
            for node in self.kg.nodes:
                if str(node["type"]) == "Slide":
                    continue
                rows.append(
                    {
                        "embedding": _embedding_to_str(node["initial_embedding"]),
                        "id": str(node["id"]),
                        "type": str(node["type"]),
                    }
                )
            return _ListRunResult(rows)

        if "MATCH (n:Slide) where n.mid = $mid RETURN n.initial_embedding as embedding, n.sid as id, n.type as type" in q:
            # Return slide nodes with initial embeddings
            rows = []
            for node in self.kg.nodes:
                if str(node["type"]) != "Slide":
                    continue
                rows.append(
                    {
                        "embedding": _embedding_to_str(node["initial_embedding"]),
                        "id": str(node["id"]),
                        "type": str(node["type"]),
                    }
                )
            return _ListRunResult(rows)

        if "MATCH p=(u:Concept)-[r]->(c:Concept)" in q and "AND NOT r:PREREQUISITE_TO" in q:
            # Return non-prerequisite concept->concept edges
            rows = []
            for edge in self.kg.relations:
                if str(edge["source_type"]) == "Slide":
                    continue
                rows.append(
                    {
                        "source": str(edge["source_id"]),
                        "stype": str(edge["source_type"]),
                        "weight": float(edge["weight"]),
                        "target": str(edge["target_id"]),
                        "ttype": str(edge["target_type"]),
                    }
                )
            return _ListRunResult(rows)

        if "MATCH p=(u:Slide)-[r]->(c:Concept)" in q and "AND NOT r:PREREQUISITE_TO" in q:
            # Return non-prerequisite slide->concept edges
            rows = []
            for edge in self.kg.relations:
                if str(edge["source_type"]) != "Slide":
                    continue
                rows.append(
                    {
                        "source": str(edge["source_id"]),
                        "stype": str(edge["source_type"]),
                        "weight": float(edge["weight"]),
                        "target": str(edge["target_id"]),
                        "ttype": str(edge["target_type"]),
                    }
                )
            return _ListRunResult(rows)

        if "MATCH p=(u:Concept)-[r]->(c:Concept)" in q and "AND r:PREREQUISITE_TO" in q:
            # Return prerequisite concept->concept edges
            rows = []
            for edge in self.kg.prerequisites:
                if str(edge["source_type"]) == "Slide":
                    continue
                rows.append(
                    {
                        "source": str(edge["source_id"]),
                        "stype": str(edge["source_type"]),
                        "weight": float(edge["weight"]),
                        "target": str(edge["target_id"]),
                        "ttype": str(edge["target_type"]),
                    }
                )
            return _ListRunResult(rows)

        if "MATCH p=(u:Slide)-[r]->(c:Concept)" in q and "AND r:PREREQUISITE_TO" in q:
            # Return prerequisite slide->concept edges
            rows = []
            for edge in self.kg.prerequisites:
                if str(edge["source_type"]) != "Slide":
                    continue
                rows.append(
                    {
                        "source": str(edge["source_id"]),
                        "stype": str(edge["source_type"]),
                        "weight": float(edge["weight"]),
                        "target": str(edge["target_id"]),
                        "ttype": str(edge["target_type"]),
                    }
                )
            return _ListRunResult(rows)

        raise ValueError(f"Unsupported query in _KGExportSession.run: {q}")


class _KGExportDriver:
    def __init__(self, kg: InMemoryKG):
        self.kg = kg

    def session(self):
        return _KGExportSession(self.kg)

    def close(self):
        pass


class _CaptureWriteSession:

    def __init__(self, sink: Dict[str, str]):
        self.sink = sink

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc, tb):
        return False

    # Capture id->embedding writes and ignore the query text
    def run(self, query: str, **params):
        node_id = params.get("id")
        embedding = params.get("embedding")
        if node_id is not None and embedding is not None:
            self.sink[str(node_id)] = str(embedding)
        return _DummyRunResult()


class _CaptureWriteDriver:
    def __init__(self):
        self.sink: Dict[str, str] = {}

    def session(self):
        return _CaptureWriteSession(self.sink)

    def close(self):
        pass


class _OriginalFileGeneratorFromMemoryKG:

    # Run extract_vector_relation() using a fake driver backed by memory KG
    @staticmethod
    def generate(kg: InMemoryKG, mid: str = "__eval__"):
        db = NeoDataBase(
            Config.NEO4J_URI,
            Config.NEO4J_USER,
            Config.NEO4J_PASSWORD,
        )
        try:
            try:
                db.driver.close()
            except Exception:
                pass

            db.driver = _KGExportDriver(kg)
            db.extract_vector_relation(mid)
        finally:
            try:
                db.close()
            except Exception:
                pass


class _OriginalModelRunner:

    # Run original model method while capturing embeddings instead of writing to Neo4j
    @staticmethod
    def _capture_result_from_model_call(model, method_name: str, *args, **kwargs) -> np.ndarray:
        try:
            model.driver.close()
        except Exception:
            pass

        capture_driver = _CaptureWriteDriver()
        model.driver = capture_driver

        method = getattr(model, method_name)
        method(*args, **kwargs)

        # Rebuild embedding matrix in the idfeature.txt order
        ordered_ids = _read_id_order_from_idfeature()
        matrix = []
        for node_id in ordered_ids:
            emb_str = capture_driver.sink.get(str(node_id))
            if emb_str is None:
                raise ValueError(
                    f"Model call finished but no captured embedding for node id={node_id}. "
                    f"method={method_name}"
                )
            matrix.append([float(x) for x in emb_str.split(",") if x != ""])

        return np.asarray(matrix, dtype=np.float32)

    # Execute the original GCN pipeline
    @staticmethod
    def run_gcn() -> np.ndarray:
        model = GCN()
        return _OriginalModelRunner._capture_result_from_model_call(model, "load_data")

    # Execute the original LightGCN pipeline
    @staticmethod
    def run_lightgcn() -> np.ndarray:
        model = LightGCN()
        return _OriginalModelRunner._capture_result_from_model_call(model, "load_data", False)

    # Execute the original RRGCN pipeline
    @staticmethod
    def run_rrgcn_1_2() -> np.ndarray:
        model = RRGCN()
        return _OriginalModelRunner._capture_result_from_model_call(model, "rrgcn_1_2")

    # Execute the original CompGCN pipeline (mult)
    @staticmethod
    def run_compgcn_mult() -> np.ndarray:
        model = relational_conceptgcn_compgcn()
        return _OriginalModelRunner._capture_result_from_model_call(
            model,
            "compgcn_without_direction_weight",
            "mult",
        )


class GCNEmbeddingEngine:
    SUPPORTED_TYPES = ["gcn", "lightgcn", "rrgcn_1_2", "compgcn_mult"]

    # Validate and store the model type
    def __init__(self, gcn_type: str = "rrgcn_1_2"):
        if gcn_type not in self.SUPPORTED_TYPES:
            raise ValueError(f"Unsupported gcn_type: {gcn_type}")
        self.gcn_type = gcn_type

    # Reuse original file-based pipelines inside a temp workspace
    def _compute_via_original_files_and_original_methods(self, kg: InMemoryKG) -> np.ndarray:
        with tempfile.TemporaryDirectory(prefix="eval_kg_") as tmpdir:
            with _pushd(tmpdir):
                _OriginalFileGeneratorFromMemoryKG.generate(kg)

                fallback_newid = _read_first_newid_from_idfeature()
                _ensure_edge_file_2d("relation.txt", fallback_newid)
                _ensure_edge_file_2d("prerequisite.txt", fallback_newid)

                if self.gcn_type == "gcn":
                    # Dispatch to the original GCN implementation
                    logger.info("GCNEmbeddingEngine: running original GCN.load_data()")
                    return _OriginalModelRunner.run_gcn()

                if self.gcn_type == "lightgcn":
                    # Dispatch to the original LightGCN implementation
                    logger.info("GCNEmbeddingEngine: running original LightGCN.load_data(False)")
                    return _OriginalModelRunner.run_lightgcn()

                if self.gcn_type == "rrgcn_1_2":
                    # EDispatch to the original RRGCN implementation
                    logger.info("GCNEmbeddingEngine: running original RRGCN.rrgcn_1_2()")
                    return _OriginalModelRunner.run_rrgcn_1_2()

                if self.gcn_type == "compgcn_mult":
                    # Dispatch to the original CompGCN implementation
                    logger.info(
                        "GCNEmbeddingEngine: running original relational_conceptgcn_compgcn."
                        "compgcn_without_direction_weight('mult')"
                    )
                    return _OriginalModelRunner.run_compgcn_mult()

        raise ValueError(f"Unsupported gcn_type: {self.gcn_type}")

    # Compute and normalize embeddings from the selected model
    def compute(self, kg: InMemoryKG) -> np.ndarray:
        result = self._compute_via_original_files_and_original_methods(kg)
        logger.info(
            f"GCNEmbeddingEngine.compute: model={self.gcn_type}, "
            f"shape={getattr(result, 'shape', None)}"
        )
        return np.asarray(result, dtype=np.float32)