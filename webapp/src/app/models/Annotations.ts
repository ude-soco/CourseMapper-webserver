export type AnnotationType = "note" | "question" | "externalResource";

export type AnnotationLocationType = "time" | "currentPage"|"allSlides"|"pageRange";;

export type AnnotationToolType = "annotation" | "brush" | "pin";

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

export interface PdfGeneralAnnotationLocation {
    type: "currentPage"|"allSlides"|"pageRange";
    startPage: number;
    lastPage: number;
}

export interface AnnotationTool {
    type: AnnotationToolType;
}

export interface Annotation {
    _id: string;
    materialID: string;
    courseId: string;
    userID: string;
    username: string;
    createdAt: number;
    updatedAt: number;
    type: AnnotationType;
    content: string;
    likes: string[];
    dislikes: string[];
    location: PdfGeneralAnnotationLocation;
    tool: PdfAnnotationTool;
    commentCount: number;
    tags: string[];
}

export interface MouseEvent {
 type: string;
 clientX: number;
 clientY: number;
 target: any;
}