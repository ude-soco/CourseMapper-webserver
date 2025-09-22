export interface ArticleElementModel {
    id: number;
    thumbnail?: string;
    keyphrases?: string[];
    keyphrases_dnu_similarity_score?:any[];
    document_dnu_similarity?:any[];
    selectedKeyphrase?: string;
    title: string;
    abstract: string;
    post_date?: string;
    author_image_url?: string;
    author_name?: string;
    uri: string;
    similarity_score: number;
    helpful_count: number;
    not_helpful_count: number;
    bookmarked_count?: number,
    like_count?: number,
    rid?: string,
    updated_at?: string,
    is_bookmarked_fill?: boolean
  }
