export type RecommendationSource = 'CourseMapper' | 'MoocCentral';

export interface FavouriteRecommendation {
  source: 'CourseMapper' | 'MoocCentral';
  addedAt: number;
  courseId: string;
  name: string;
  teacher?: string;
}