export interface VideoElementModel {
    id: string;
    title: string;
    thumbnail: string;
    keyphrases?: string[];
    description?: string;
    description_full: string;
    views: string;
    publish_time: string;
    uri: string;
    similarity_score: number;
    helpful_counter: number;
    not_helpful_counter: number;
    duration: string;
    bookmarked_count?: number,
    like_count?: number
  }
