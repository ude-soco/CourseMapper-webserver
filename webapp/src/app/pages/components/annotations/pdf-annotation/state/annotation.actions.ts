import { createAction, props } from "@ngrx/store";
import { Annotation } from "src/app/models/Annotations";

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

export const emptyActionWithSelection = createAction(
    'Set Current Annotation',
    props<{annotation: Annotation}>()
);

