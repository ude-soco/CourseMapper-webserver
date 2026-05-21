import numpy as np
import random
import torch
from typing import Tuple
from torch_geometric.nn.inits import glorot 

EMBEDDING_DIM = 768


def glorot_seed(
        shape: Tuple,
        dtype: torch.dtype = torch.float32,
    ):

    a = torch.empty(shape, dtype=dtype)
    glorot(a)

    return a