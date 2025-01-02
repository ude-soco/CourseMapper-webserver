import { Reply } from './Reply';
import { DrawingData } from './Drawing';

export type AnnotationType = 'Note' | 'Question' | 'External Resource';

export type AnnotationLocationType =
  | 'time'
  | 'currentPage'
  | 'allSlides'
  | 'pageRange';

export type AnnotationToolType = 'annotation' | 'brush' | 'pin';

export interface PdfAnnotationTool {
  _id: any;
  type: PdfToolType;
  color?: string;
  coordinates?: any[];
  page?: any;
  rect?: any;
}

export interface VideoAnnotationTool extends AnnotationTool {
  type: 'annotation';
}

export interface VideoBrushTool extends AnnotationTool {
  type: 'brush';
  data: DrawingData;
}

export interface VideoPinTool extends AnnotationTool {
  type: 'pin';
  x: number;
  y: number;
}

export enum PdfToolType {
  Highlight = 'highlight',
  DrawBox = 'drawing',
  Pin = 'pinpoint',
  Annotation = 'annotation',
  None = 'none',
}

export interface PdfGeneralAnnotationLocation {
startPage?: number;
  lastPage?: number;
  type: 'Current Slide' | 'All Slides' | 'Slide Range';

}

export interface VideoAnnotationLocation {
  type: 'time';
  from: number;
  to: number;
}

export interface AnnotationTool {
  type: AnnotationToolType;
}

export interface Annotation {
materialType?: string;
  _id?: string;
  type?: AnnotationType;
  content?: string;
  mentionedUsers?: {
    userId: string;
    name: string;
    username: string;
  }[];
  location: VideoAnnotationLocation | PdfGeneralAnnotationLocation;
  tool?:
    | VideoAnnotationTool
    | VideoBrushTool
    | VideoPinTool
    | PdfAnnotationTool;
  materialId?: string;
  courseId?: string;
  channelId?: string;
  author?: {
    userId?: string;
    name?: string;
    username?: string;
    email?: string;
    role?: {
      _id?: string;
      name?: string;
    };
  };
  likes?: string[];
  dislikes?: string[];
  replies?: Reply[];
  createdAt?: number;
  commentCount?: number;
  tags?: string[];
}
