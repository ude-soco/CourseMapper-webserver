export interface ArticleElementModel {
    id: number;
    thumbnail?: string;
    keyphrases?: string[];
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
