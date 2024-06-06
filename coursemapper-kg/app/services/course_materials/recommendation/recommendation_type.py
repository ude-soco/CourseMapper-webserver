from enum import Enum


class RecommendationType(Enum):
    WITHOUT_EMBEDDING = "without_embedding"
    CONTENT_BASED_DOCUMENT_VARIANT = "static_document_based"
    CONTENT_BASED_KEYPHRASE_VARIANT = "static_keyphrase_based"
    PKG_BASED_KEYPHRASE_VARIANT = "dynamic_keyphrase_based"
    PKG_BASED_DOCUMENT__VARIANT = "dynamic_document_based"
    COMBINED_DYNAMIC = "combined_dynamic"
    COMBINED_STATIC = "combined_static"

    def map_type(recommendation_type: str, find_type = "k"):
        """
            Get key or Value:
            recommendation_type: RecommendationType.PKG_BASED_KEYPHRASE_VARIANT,
            find_type: v = value and k = key
        """
        sources = {
            "1": RecommendationType.PKG_BASED_KEYPHRASE_VARIANT,
            "2": RecommendationType.PKG_BASED_DOCUMENT__VARIANT,
            "3": RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT,
            "4": RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT,
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
            result = RecommendationType.PKG_BASED_KEYPHRASE_VARIANT
        elif recommendation_type == "2":
            result = RecommendationType.PKG_BASED_DOCUMENT__VARIANT
        elif recommendation_type == "3":
            result = RecommendationType.CONTENT_BASED_KEYPHRASE_VARIANT
        elif recommendation_type == "4":
            result = RecommendationType.CONTENT_BASED_DOCUMENT_VARIANT
        
        return result
