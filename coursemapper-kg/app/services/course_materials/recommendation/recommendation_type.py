from enum import Enum


class RecommendationType(Enum):
    WITHOUT_EMBEDDING = "without_embedding"
    STATIC_DOCUMENT_BASED = "static_document_based"
    STATIC_KEYPHRASE_BASED = "static_keyphrase_based"
    DYNAMIC_KEYPHRASE_BASED = "dynamic_keyphrase_based"
    DYNAMIC_DOCUMENT_BASED = "dynamic_document_based"
    COMBINED_DYNAMIC = "combined_dynamic"
    COMBINED_STATIC = "combined_static"

    def map_type(recommendation_type: str, find_type = "k"):
        """
            Get key or Value:
            recommendation_type: RecommendationType.DYNAMIC_KEYPHRASE_BASED,
            find_type: v = value and k = key
        """
        sources = {
            "1": RecommendationType.DYNAMIC_KEYPHRASE_BASED,
            "2": RecommendationType.DYNAMIC_DOCUMENT_BASED,
            "3": RecommendationType.STATIC_KEYPHRASE_BASED,
            "4": RecommendationType.STATIC_DOCUMENT_BASED,
        }

        if find_type == "v":
            value = None
            for k, v in sources.items():
                if recommendation_type == v:
                    value = k
                    break
        else:
            value = sources[recommendation_type]
            
        return value

    def map_type2(recommendation_type: str):
        if recommendation_type == "1":
            result = RecommendationType.DYNAMIC_KEYPHRASE_BASED
        elif recommendation_type == "2":
            result = RecommendationType.DYNAMIC_DOCUMENT_BASED
        elif recommendation_type == "3":
            result = RecommendationType.STATIC_KEYPHRASE_BASED
        elif recommendation_type == "4":
            result = RecommendationType.STATIC_DOCUMENT_BASED
        
        return result
