export type AnnotationType = 'note' | 'question' | 'externalResource';

export type AnnotationLocationType =
  | 'time'
  | 'currentPage'
  | 'allSlides'
  | 'pageRange';

export type AnnotationToolType = 'annotation' | 'brush' | 'pin';

export interface PdfAnnotationTool {
  _id: any;
  type: PdfToolType;
  color: string;
  coordinates: any[];
  page?: any;
  rect?: any;
}

export enum PdfToolType {
  Highlight = 'highlight',
  DrawBox = 'drawing',
  Pin = 'pinpoint',
  None = 'none',
}

export interface PdfGeneralAnnotationLocation {
  type: 'currentPage' | 'allSlides' | 'pageRange';
  startPage: number;
  lastPage: number;
}

export interface AnnotationTool {
  type: AnnotationToolType;
}

export interface Annotation {
  _id?: string;
  type?: AnnotationType;
  content?: string;
  location: PdfGeneralAnnotationLocation;
  tool: PdfAnnotationTool;
  materialID?: string;
  courseId?: string;
  author?:{
    userId?: string;
    name?: string;
  };
  likes?: string[];
  dislikes?: string[];
  replies?: string[];
  createdAt?: number
  commentCount?: number;
  tags?: string[];
  initials?: string;
  elapsedTime?: string;
}
