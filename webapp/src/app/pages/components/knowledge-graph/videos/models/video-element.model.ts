export interface VideoElementModel {
    id: number,
    title: string;
    thumbnail: string;
    keyphrases?: string[];
    keyphrases_concept_similarity_score?:any[];
    document_concept_similarity?:any[];
    description?: string;
    description_full: string;
    views: string;
    publish_time: string;
    uri: string;
    similarity_score: number;
    helpful_count: number;
    not_helpful_count: number;
    duration: string;
    bookmarked_count?: number,
    like_count?: number,
    channel_title?: string,
    rid?: string,
    updated_at?: string,
    is_bookmarked_fill?: boolean
  }
