from sentence_transformers import SentenceTransformer
from typing import List, overload
from numpy import ndarray
from numpy import dot
from numpy.linalg import norm

class EmbeddingService:
    def __init__(self, model):
        self._model = SentenceTransformer(model)

    @overload
    def encode(self, sentences: List[str]) -> List[ndarray]: ...

    @overload
    def encode(self, sentences: str) -> ndarray: ...

    def encode(self, sentences: List[str] | str) -> List[ndarray] | ndarray:
        result = self._model.encode(sentences, convert_to_numpy=True)
        assert isinstance(result, ndarray)
        return result

@overload
def cos_sim(a: ndarray, b: ndarray) -> float: ...

@overload
def cos_sim(a: ndarray, b: List[ndarray]) -> List[float]: ...

@overload
def cos_sim(a: List[ndarray], b: ndarray) -> List[float]: ...

@overload
def cos_sim(a: List[ndarray], b: List[ndarray]) -> List[List[float]]: ...

def cos_sim(a: ndarray | List[ndarray], b: ndarray | List[ndarray]) -> float | List[float] | List[List[float]]:
    if isinstance(a, ndarray) and isinstance(b, ndarray):
        return dot(a, b)/(norm(a)*norm(b))
    if isinstance(a, ndarray) and isinstance(b, List):
        return [dot(a, bi)/(norm(a)*norm(bi)) for bi in b]
    if isinstance(a, List) and isinstance(b, ndarray):
        return [dot(a, bi)/(norm(a)*norm(bi)) for bi in b]
    if isinstance(a, List) and isinstance(b, List):
        return [[dot(ai, bi)/(norm(ai)*norm(bi)) for ai in a] for bi in b]
    raise Exception('Unexpected state')
