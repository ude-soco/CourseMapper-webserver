import { createAction, props } from "@ngrx/store";
import { Annotation, AnnotationType, PdfToolType } from "src/app/models/Annotations";
import { Material } from "src/app/models/Material";
import { Reply } from "src/app/models/Reply";

// Strongly typed actions

export const postAnnotation = createAction(
    '[Annotation] Post Annotation Action',
    props<{ annotation: Annotation}>()
);

export const postAnnotationSuccess = createAction(
    '[Annotation] Post Success',
    // props<{postedAnnotation: Annotation}>()
);

export const postAnnotationFail = createAction(
    '[Annotation] Post Fail',
    props<{ error: string }>()
);

export const loadAnnotations = createAction(
    '[Annotation] Get Annotations Action',
);

export const loadAnnotationsSuccess = createAction(
    '[Annotation] Load Annotations Success',
    props<{annotations: Annotation[]}>()
);

export const loadAnnotationsFail = createAction(
    '[Annotation] Load Annotations Fail',
    props<{error: string}>()
);

export const setSelectedTool = createAction(
    '[Annotation] Set Selected Tool',
    props<{selectedTool: PdfToolType}>()
);

export const setCreateAnnotationFromPanel = createAction(
    '[Annotation] Show Slides Dropdown Menue',
    props<{createAnnotationFromPanel: boolean}>()
);

export const setAnnotationProperties = createAction(
    '[Annotation] Set Annotation Properties',
    props<{annotation: Annotation}>()
);

export const setIsAnnotationDialogVisible = createAction(
    '[Annotation] Set AnnotationDialogVisible Value',
    props<{isAnnotationDialogVisible: boolean}>()
);

export const setIsAnnotationCanceled = createAction(
    '[Annotation] Set AnnotationCanceled Value',
    props<{isAnnotationCanceled: boolean}>()
);

export const setPdfSearchQuery = createAction(
    '[Annotation] Set Pdf Search Query Value',
    props<{pdfSearchQuery: string}>()
);

export const setZoomIn = createAction(
    '[Annotation] Set Pdf Zoom In Value'
);

export const setZoomOut = createAction(
    '[Annotation] Set Pdf Zoom Out Value'
);

export const resetZoom = createAction(
    '[Annotation] Reset Pdf Zoom Value'
);

export const toggleShowHideAnnotation = createAction(
    '[Annotation] Toggle Show/Hide Annotation Boolean Value'
);

export const resetAnnotationStoreValues = createAction(
    '[Annotation] Reset Annotation Store Values'
);

export const setCurrentPdfPage = createAction(
    '[Annotation] Set Current Pdf Page',
    props<{pdfCurrentPage: number}>()
);

export const setPdfTotalPages = createAction(
    '[Annotation] Set Current Pdf Total Pages',
    props<{pdfTotalPages: number}>()
);

export const loadReplies = createAction(
    '[Annotation] Get Replies Action',
    props<{annotations: Annotation[]}>()
);

export const loadRepliesSuccess = createAction(
    '[Annotation] Load Replies Success',
);

export const loadRepliesFail = createAction(
    '[Annotation] Load Replies Fail',
    props<{error: string}>()
);

export const updateAnnotationsWithReplies = createAction(
    '[Annotation] Update Annotations With Replies',
    props<{annotations: Annotation[]}>()
);

export const updateAnnotationsWithRepliesFail = createAction(
    '[Annotation] Update Annotations With Replies Failed',
    props<{error: string}>()
);

export const updateAnnotationsWithRepliesSuccess = createAction(
    '[Annotation] Updated Annotations With Replies Successfully',
    props<{error: string}>()
);

export const postReply = createAction(
    '[Annotation] Post Reply Action',
    props<{ annotation: Annotation, reply: Reply}>()
);

export const postReplySuccess = createAction(
    '[Annotation] Post Reply Success'
);

export const postReplyFail = createAction(
    '[Annotation] Post Reply Fail',
    props<{ error: string }>()
);

export const likeAnnotation = createAction(
    '[Annotation] Like Annotation Action',
    props<{ annotation: Annotation}>()
);

export const likeAnnotationSuccess = createAction(
    '[Annotation] Like Annotation Success'
);

export const likeAnnotationFail = createAction(
    '[Annotation] Like Annotation Fail',
    props<{ error: string }>()
);

export const dislikeAnnotation = createAction(
    '[Annotation] Dislike Annotation Action',
    props<{ annotation: Annotation}>()
);

export const dislikeAnnotationSuccess = createAction(
    '[Annotation] Dislike Annotation Success'
);

export const dislikeAnnotationFail = createAction(
    '[Annotation] Dislike Annotation Fail',
    props<{ error: string }>()
);

export const likeReply = createAction(
    '[Annotation] Like Reply Action',
    props<{ reply: Reply}>()
);

export const likeReplySuccess = createAction(
    '[Annotation] Like Reply Success'
);

export const likeReplyFail = createAction(
    '[Annotation] Like Reply Fail',
    props<{ error: string }>()
);

export const dislikeReply = createAction(
    '[Annotation] Dislike Reply Action',
    props<{ reply: Reply}>()
);

export const dislikeReplySuccess = createAction(
    '[Annotation] Dislike Reply Success'
);

export const dislikeReplyFail = createAction(
    '[Annotation] Dislike Reply Fail',
    props<{ error: string }>()
);

export const setHideRepliesButton = createAction(
    '[Annotation] Set Hide Replies Button',
    props<{ hideRepliesButton: boolean }>()
);

export const updateAnnotationsOnSocketEmit = createAction(
    '[Annotation] Update Stored Annotations',
    props<{payload: any}>()
);

export const deleteReply = createAction(
    '[Reply] Delete Reply',
    props<{reply: Reply}>()
);

export const deleteReplySuccess = createAction(
    '[Reply] Reply Deleted Successfully'
);

export const deleteReplyFail = createAction(
    '[Reply] Failed to delete the reply',
    props<{error: string}>()
);