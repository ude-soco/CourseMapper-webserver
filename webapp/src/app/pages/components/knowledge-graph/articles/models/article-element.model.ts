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
    helpful_counter: number;
    not_helpful_counter: number;
    bookmarked_count?: number,
    like_count?: number
  }
