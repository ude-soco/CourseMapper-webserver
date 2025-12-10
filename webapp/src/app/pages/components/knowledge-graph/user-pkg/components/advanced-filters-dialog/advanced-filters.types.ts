// Types for course hierarchy
export interface SlideInfo {
  sid: string;
  cid: string;
}

export interface MaterialInfo {
  _id: string;
  name: string;
  type: string;
  courseId: string;
  slides: SlideInfo[];
}

export interface CourseHierarchy {
  _id: string;
  name: string;
  shortName: string;
  materials: MaterialInfo[];
}

// Types for filter profiles
export interface FilterProfile {
  _id?: string;
  name: string;
  slideIds: string[];
}
