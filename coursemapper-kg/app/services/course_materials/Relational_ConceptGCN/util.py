import torch
import numpy as np
from typing import Tuple, Union
import scipy.sparse as sp
from torch_geometric.nn.inits import glorot, uniform

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
    torch.manual_seed(seed)
    a = torch.zeros(shape, device=None, dtype=dtype)
    glorot(a)
    return a


def uniform_seed(
    shape: Tuple,
    device: Union[torch.device, str] = "cuda",
    seed: int = 42,
    dtype: torch.dtype = torch.float32,
):
    """Randomly generates a tensor based on a seed and uniform initialization.

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
    torch.manual_seed(seed)
    a = torch.zeros(shape, device=None, dtype=dtype)
    uniform(a)
    return a

def normalize(mx):
    rowsum = np.array(mx.sum(1))
    d_inv = np.power(rowsum, -0.5).flatten()
    d_inv[np.isinf(d_inv)] = 0.0
    d_mat_inv = sp.diags(d_inv)
    norm_adj = d_mat_inv.dot(mx)
    norm_adj = norm_adj.dot(d_mat_inv)
    return norm_adj