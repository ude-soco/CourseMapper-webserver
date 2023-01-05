import { createAction, props } from "@ngrx/store";
import { Annotation } from "src/assets/Data/Annotations";

// Strongly typed actions

export const createAnnotation = createAction(
    '[Annotation] Post Annotation Action',
    props<{ annotation: Annotation}>()
);

export const createAnnotationSucess = createAction(
    '[Annotation] Post Success'
);

export const createAnnotationFail = createAction(
    '[Annotation] Post Fail',
    props<{ error: string }>()
);

export const emptyActionWithSelection = createAction(
    'Set Current Annotation',
    props<{annotation: Annotation}>()
);

