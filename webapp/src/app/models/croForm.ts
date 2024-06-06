import { ArticleElementModel } from "../pages/components/knowledge-graph/articles/models/article-element.model"
import { VideoElementModel } from "../pages/components/knowledge-graph/videos/models/video-element.model"

export interface ActivatorPartCRO {
    resetFormStatus: boolean,
    modelStatus: boolean,
    vennDiagramStatus: boolean
}

export interface Concept {
    final_embedding?: string,
    initial_embedding?: string,
    name?: string,
    rank?: number,
    weight?: number,
    mid?: string,
    abstract?: string,
    wikipedia?: string,
    type?: string,
    uri?: string,
    cid?: string
}

export interface Neo4jResult {
    records: Concept[]
}

export interface FactorWeight {
    similarity_score?: number,
    creation_date?: number,
    views?: number,
    like_count?: number
    user_rating?: number,
    nbr_saves?: number,
}

// export interface ResourceNodesContentVideo {
//     node_id: number,
// }

// export interface ResourceNodesContentArticle {
//     node_id: number,
// }

// export interface ResourceNodes {
//     current_page: number,
//     total_pages: number,
//     total_items: number,
//     content: VideoElementModel[] | ArticleElementModel[],
// }

// export interface ResourcesPagination {
//     algorithm_model: number,
//     cro_form?: any,
//     concepts?: any,
//     edges?: number,
//     nodes: ResourceNodes,
// }

export interface RecommendationNodesVideo {
    current_page: number,
    total_pages: number,
    total_items: number,
    content: VideoElementModel[],
}
export interface RecommendationNodesArticle {
    current_page: number,
    total_pages: number,
    total_items: number,
    content: ArticleElementModel[],
}
export interface RecommendationNodes {
    videos: RecommendationNodesVideo,
    articles: RecommendationNodesArticle
}
export interface RecommendationTypePagination {
    nodes: RecommendationNodes, // VideoElementModel[] | ArticleElementModel[],
}
export interface ResourcesPagination {
    cro_form?: any,
    concepts?: Concept[],
    edges?: any,
    recommendation_type_1: RecommendationTypePagination,
    recommendation_type_2: RecommendationTypePagination,
    recommendation_type_3: RecommendationTypePagination,
    recommendation_type_4: RecommendationTypePagination,
}





export interface ModelRec {
    model_1: boolean,
    model_2: boolean,
    model_3: boolean,
    model_4: boolean
}

export interface RecommendationAlgorithm {
    status: boolean,
    models: ModelRec
}

export interface CROform {
    category?: string,
    concepts?: Concept[],
    recommendation_algorithm?: RecommendationAlgorithm,
    vennDiagramStatus?: boolean,
    countOriginal?: number
}

export class CROForm {
    category: string;
    concepts: Concept[];
    recommendation_algorithm: RecommendationAlgorithm;
    vennDiagramStatus: boolean;
    countOriginal?: number
}