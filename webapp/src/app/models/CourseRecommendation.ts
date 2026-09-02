export interface CourseRecommendation {
  source: 'CourseMapper' | 'MoocCentral';
  score: number;
  course_id: string;
  name: string;
  institutions?: string[];
  teachers?: string[];
  platforms?: string[];
  node_properties:
    | {
        cid: string;
        name: string;
      }
    | {
        audience: string;
        certification: string;
        course_category: string;
        course_content: string;
        course_id: string;
        description: string;
        duration: string;
        goal: string;
        keywords: string;
        language: string;
        level: string;
        link: string;
        name: string;
        number_of_participants: string;
        prerequisites: string;
        price: string;
        rating: string;
        recommendations: string;
      };
}
