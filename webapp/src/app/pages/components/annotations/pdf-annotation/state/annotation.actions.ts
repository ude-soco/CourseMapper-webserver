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

export const toggleHighlightSelected = createAction(
    '[Annotation] Toggle Highlight Selected'
);

export const setSelectedTool = createAction(
    '[Annotation] Set Selected Tool',
    props<{selectedTool: PdfToolType}>()
);

export const setCreateAnnotationFromPanel = createAction(
    '[Annotation] Show Slides Dropdown Menue',
    props<{createAnnotationFromPanel: boolean}>()
);

export const setSelectedAnnotationType = createAction(
    '[Annotation] Set Selected Annotation Type',
    props<{selectedAnnotationType: AnnotationType}>()
);

export const setAnnotationContent = createAction(
    '[Annotation] Set Annotation Content Text',
    props<{annotationContent: string}>()
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

