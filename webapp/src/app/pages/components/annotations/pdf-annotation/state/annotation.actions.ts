import { createAction, props } from "@ngrx/store";
import { Annotation } from "src/app/models/Annotations";
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

export const emptyActionWithSelection = createAction(
    'Set Current Annotation',
    props<{annotation: Annotation}>()
);

