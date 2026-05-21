"""
utils.py

Reusable helper functions for the MOOCube evaluation pipeline.
MOOCube 评估流程可复用的工具函数。
"""

import json
import os
import random
from datetime import datetime
from typing import Any, Dict, Iterable, List, Tuple

import numpy as np
import torch

try:
    from torch_geometric.nn.inits import glorot
except ImportError:
    def glorot(tensor):
        """Fallback Glorot initializer when torch_geometric is unavailable."""
        return torch.nn.init.xavier_uniform_(tensor)

from config import EMBEDDING_DIM


# ========================
# Logging / 日志输出
# ========================
def print_info(message: str) -> None:
    """Print info log. / 输出信息日志。"""
    print(f"[INFO] {message}")


def print_warning(message: str) -> None:
    """Print warning log. / 输出警告日志。"""
    print(f"[WARNING] {message}")


def print_error(message: str) -> None:
    """Print error log. / 输出错误日志。"""
    print(f"[ERROR] {message}")


# ========================
# Text Cleaning / 文本清洗
# ========================
def clean_unusual_line_terminators(text: str) -> str:
    """Remove BOM and unusual Unicode line separators. / 移除 BOM 与特殊换行符。"""
    return text.replace("\ufeff", "").replace("\u2028", "").replace("\u2029", "")


# ========================
# JSON / Text Loading
# JSON / 文本加载
# ========================
def load_json(file_path: str):
    """
    Load JSON file with robust fallback.
    以稳健方式加载 JSON 文件，支持以下格式：
    1) JSON array: [...]
    2) JSON object/dict: {...}
    3) JSON Lines (one JSON per line)
    """
    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        # Read full file then normalize special chars.
        # 读取全文并清洗特殊字符。
        content = clean_unusual_line_terminators(f.read()).strip()

    if not content:
        print_warning(f"Empty file: {file_path}")
        return []

    # First try parsing as a complete JSON value.
    # 优先按“完整 JSON”解析（避免把 JSON 对象误当成 JSONL）。
    try:
        data = json.loads(content)
        if isinstance(data, list):
            print_info(f"Loaded {len(data)} records from {file_path}")
        elif isinstance(data, dict):
            print_info(f"Loaded JSON object with {len(data)} keys from {file_path}")
        else:
            print_info(f"Loaded JSON value from {file_path}")
        return data
    except Exception:
        # If full parse fails, fallback to JSON Lines.
        # 如果完整解析失败，则回退到 JSON Lines。
        pass

    data = []
    for line_num, line in enumerate(content.splitlines(), 1):
        line = line.strip()
        if not line:
            continue
        try:
            data.append(json.loads(line))
        except Exception:
            # Keep going when one line is broken.
            # 单行坏数据跳过，不影响整体加载。
            print_warning(f"Skip bad JSON line {line_num} in {file_path}")

    print_info(f"Loaded {len(data)} records from {file_path}")
    return data


def load_course_concept_tsv(file_path: str) -> List[Tuple[str, str]]:
    """
    Load (course_id, concept_id) pairs from a whitespace-separated file.
    从空白分隔文件中读取 (course_id, concept_id) 对。
    """
    pairs: List[Tuple[str, str]] = []

    with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
        for line_num, line in enumerate(f, 1):
            line = clean_unusual_line_terminators(line).strip()
            if not line:
                continue

            parts = line.split()
            if len(parts) < 2:
                print_warning(f"Skip bad course-concept line {line_num} in {file_path}")
                continue

            course_id = parts[0].strip()
            concept_id = parts[1].strip()
            pairs.append((course_id, concept_id))

    print_info(f"Loaded {len(pairs)} course-concept pairs from {file_path}")
    return pairs


def save_json(data: Any, file_path: str) -> None:
    """
    Save data as pretty JSON (UTF-8).
    以 UTF-8 格式保存 JSON（带缩进，便于阅读）。
    """
    # Ensure parent directory exists.
    # 确保父目录存在。
    dir_path = os.path.dirname(file_path)
    if dir_path:
        os.makedirs(dir_path, exist_ok=True)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def save_txt(lines: List[str], file_path: str) -> None:
    """
    Save lines into a text file.
    将字符串列表写入文本文件（每项一行）。
    """
    dir_path = os.path.dirname(file_path)
    if dir_path:
        os.makedirs(dir_path, exist_ok=True)

    with open(file_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print_info(f"Saved txt file to: {file_path}")


# ========================
# Time Parsing / 时间解析
# ========================
def parse_time(time_str: str) -> datetime:
    """Parse datetime: YYYY-mm-dd HH:MM:SS / 解析完整时间字符串。"""
    return datetime.strptime(time_str, "%Y-%m-%d %H:%M:%S")


def parse_date(date_str: str) -> datetime:
    """Parse date: YYYY-mm-dd / 解析日期字符串。"""
    return datetime.strptime(date_str, "%Y-%m-%d")


# ========================
# Simple Statistics Helpers
# 简单统计辅助函数
# ========================
def summarize_counter(counter: Dict[int, int], title: str) -> List[str]:
    """
    Convert a frequency dict to display lines.
    将计数字典转换为可打印的文本行。
    """
    lines = [title, "-" * 60]
    for key in sorted(counter.keys()):
        lines.append(f"{key:<6} -> {counter[key]}")
    if not counter:
        lines.append("(empty)")
    lines.append("")
    return lines


# ========================
# Math / ML Helpers
# 数学与机器学习辅助函数
# ========================
def cosine_similarity(vec1: Iterable[float], vec2: Iterable[float]) -> float:
    """
    Compute cosine similarity.
    计算余弦相似度。
    """
    vec1 = np.array(vec1, dtype=float)
    vec2 = np.array(vec2, dtype=float)

    norm1 = np.linalg.norm(vec1)
    norm2 = np.linalg.norm(vec2)
    if norm1 == 0 or norm2 == 0:
        # Return 0 for zero vectors to avoid division-by-zero.
        # 零向量时返回 0，避免除零错误。
        return 0.0
    return float(np.dot(vec1, vec2) / (norm1 * norm2))


def weighted_sum(vectors: List[Iterable[float]], weights: List[float]) -> np.ndarray:
    """
    Weighted sum of vectors with normalization.
    对向量进行加权求和，并自动归一化权重。
    """
    if not vectors:
        return np.array([])

    # Enforce strict length consistency.
    # 严格检查长度一致，避免 zip 静默截断。
    if len(vectors) != len(weights):
        raise ValueError(
            f"Length mismatch: len(vectors)={len(vectors)}, len(weights)={len(weights)}"
        )

    vectors_np = [np.array(v, dtype=float) for v in vectors]
    weights_np = np.array(weights, dtype=float)

    # If all weights sum to ~0, fallback to plain sum.
    # 若权重和接近 0，退化为普通求和。
    if np.allclose(weights_np.sum(), 0.0):
        return np.sum(vectors_np, axis=0)

    weights_np = weights_np / weights_np.sum()
    return np.sum([w * v for w, v in zip(weights_np, vectors_np)], axis=0)


def normalize_vector(vec: Iterable[float]) -> np.ndarray:
    """
    L2-normalize a vector.
    对向量做 L2 归一化。
    """
    vec = np.array(vec, dtype=float)
    norm = np.linalg.norm(vec)
    if norm == 0:
        return vec
    return vec / norm


def glorot_seed(
    shape: Tuple[int, ...],
    dtype: torch.dtype = torch.float32,
) -> torch.Tensor:
    """
    Initialize a tensor by Glorot initializer.
    使用 Glorot 方法初始化张量。
    """
    tensor = torch.empty(shape, dtype=dtype)
    glorot(tensor)
    return tensor


def build_relation_weight_matrix(
    embedding_dim: int = EMBEDDING_DIM,
    dtype: torch.dtype = torch.float32,
) -> torch.Tensor:
    """
    Build one relation matrix with shape (embedding_dim, embedding_dim).
    构建一个关系矩阵，形状为 (embedding_dim, embedding_dim)。
    """
    return glorot_seed((embedding_dim, embedding_dim), dtype=dtype)


def build_relation_weight_matrix_numpy(
    embedding_dim: int = EMBEDDING_DIM,
    dtype: torch.dtype = torch.float32,
) -> np.ndarray:
    """
    Build one Glorot-initialized relation matrix and return numpy array.
    构建一个 Glorot 初始化的关系矩阵并返回 numpy 数组。
    """
    return build_relation_weight_matrix(
        embedding_dim=embedding_dim,
        dtype=dtype,
    ).cpu().numpy()


def deduplicate_keep_order(items: List[Any]) -> List[Any]:
    """
    Deduplicate while preserving first-seen order.
    去重并保持首次出现顺序。
    """
    seen = set()
    output = []
    for item in items:
        if item not in seen:
            seen.add(item)
            output.append(item)
    return output


def random_sample(items: List[Any], sample_size: int, seed: int = 42) -> List[Any]:
    """
    Deterministic random sampling with seed.
    带随机种子的可复现抽样。
    """
    if sample_size < 0:
        raise ValueError("sample_size must be >= 0")
    if sample_size >= len(items):
        return list(items)

    rng = random.Random(seed)
    return rng.sample(items, sample_size)