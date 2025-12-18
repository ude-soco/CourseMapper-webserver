import torch
import random
import numpy as np
from typing import Tuple, Union
import scipy.sparse as sp
from torch_geometric.nn.inits import glorot

def glorot_seed(
    shape: Tuple,
    seed: int = 42,
    dtype: torch.dtype = torch.float32,
):
    """Randomly generates a tensor based on a seed and Glorot initialization.

    Args:
        shape (Tuple):
            Desired shape of the tensor.

        device (torch.device or str, optional):
            Device to generate tensor on. Defaults to "cuda".

        seed (int, optional):
            The seed. Defaults to 42.

        dtype (torch.dtype, optional):
            Tensor type. Defaults to torch.float32.

    Returns:
        torch.Tensor: The randomly generated tensor
    """
    seed = random.randint(0, 100) 
    torch.manual_seed(seed)
    a = torch.zeros(shape, device=None, dtype=dtype)
    glorot(a)
    return a

def normalize(mx):
    """Normalize adjacency matrix using symmetric normalization.
    
    Handles zero-degree nodes (isolated nodes) by setting their values to 0.
    Formula: D^(-1/2) * A * D^(-1/2) where D is the degree matrix.
    """
    rowsum = np.array(mx.sum(1))
    
    # Handle division by zero: replace zero values with 1 before taking power
    # This prevents the FloatingPointError
    rowsum_safe = np.where(rowsum == 0, 1, rowsum)
    
    d_inv = np.power(rowsum_safe, -0.5).flatten()
    
    # Set values corresponding to zero-degree nodes to 0
    d_inv[rowsum.flatten() == 0] = 0.0
    
    d_mat_inv = sp.diags(d_inv)
    norm_adj = d_mat_inv.dot(mx)
    norm_adj = norm_adj.dot(d_mat_inv)
    return norm_adj