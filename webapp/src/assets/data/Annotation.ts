import { DrawingData } from "./Drawing";

export type AnnotationType = "note" | "question" | "externalResource";

export type AnnotationLocationType = "time" | "currentPage"|"allSlides"|"pageRange";;

export type AnnotationToolType = "annotation" | "brush" | "pin";

export interface Annotation {
    _id: string;
    materialID: string;
    userID: string;
    username: string;
    createdAt: number;
    updatedAt: number;
    type: AnnotationType;
    content: string;
    likes: string[];
    dislikes: string[];
    // TODO Add more annotation locations and tools here
    location: VideoAnnotationLocation | PdfGeneralAnnotationLocation;
    tool: VideoAnnotationTool | VideoBrushTool | VideoPinTool | PdfAnnotationTool;
    commentCount: number;
    tags: string[];
}

export interface CreateAnnotationDTO {
    type: AnnotationType;
    content: string;
    // TODO Add more annotation locations and tools here
    location: VideoAnnotationLocation | PdfGeneralAnnotationLocation;
    tool: VideoAnnotationTool | VideoBrushTool | VideoPinTool | PdfAnnotationTool;
}

export interface UpdateAnnotationDTO {
    type: AnnotationType;
    content: string;
    location: VideoAnnotationLocation | PdfGeneralAnnotationLocation;
}

export interface VideoAnnotationLocation {
    type: "time";
    from: number;
    to: number;
}

export interface AnnotationTool {
    type: AnnotationToolType;
}

export interface VideoAnnotationTool extends AnnotationTool {
    type: "annotation";
}

export interface VideoBrushTool extends AnnotationTool {
    type: "brush";
    data: DrawingData;
}

export interface VideoPinTool extends AnnotationTool {
    type: "pin";
    x: number;
    y: number;
}
export interface PdfGeneralAnnotationLocation {
    type: "currentPage"|"allSlides"|"pageRange";
    startPage: number;
    lastPage: number;
}
export interface PdfAnnotationTool {
    _id:any
    type:PdfToolType;
    color:string;
    coordinates:any[]
    page?:any,
    rect?:any
}
export enum PdfToolType{
    Highlight= "highlight",DrawBox="drawing",Pin="pinpoint",None="none"
}

export interface AnnotationLikesDislikes {
    likes: string[];
    dislikes: string[];
}

export interface CommentLikesDislikes {
    likes: string[];
    dislikes: string[];
}