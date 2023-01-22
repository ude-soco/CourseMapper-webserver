import { createAction, props } from "@ngrx/store";
import { Annotation, AnnotationType, PdfToolType } from "src/app/models/Annotations";
import { Material } from "src/app/models/Material";

// Strongly typed actions

export const postAnnotation = createAction(
    '[Annotation] Post Annotation Action',
    props<{ annotation: Annotation}>()
);

export const postAnnotationSuccess = createAction(
    '[Annotation] Post Success'
);

export const postAnnotationFail = createAction(
    '[Annotation] Post Fail',
    props<{ error: string }>()
);

export const loadAnnotations = createAction(
    '[Annotation] Get Annotations Action',
    props<{material: Material}>()
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

