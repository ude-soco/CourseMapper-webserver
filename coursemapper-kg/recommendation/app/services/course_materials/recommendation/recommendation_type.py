from enum import Enum


class RecommendationType(Enum):
    WITHOUT_EMBEDDING = "without_embedding"
    STATIC_DOCUMENT_BASED = "static_document_based"
    STATIC_KEYPHRASE_BASED = "static_keyphrase_based"
    DYNAMIC_KEYPHRASE_BASED = "dynamic_keyphrase_based"
    DYNAMIC_DOCUMENT_BASED = "dynamic_document_based"
    COMBINED_DYNAMIC = "combined_dynamic"
    COMBINED_STATIC = "combined_static"
