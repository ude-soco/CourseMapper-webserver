export type RecommendationSource = 'CourseMapper' | 'MoocCentral';

export interface FavouriteRecommendation {
  source: 'CourseMapper' | 'MoocCentral';
  addedAt: string;
  courseId: string;
  name: string;
  teacher?: string;
}