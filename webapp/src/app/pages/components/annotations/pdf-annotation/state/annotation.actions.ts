import { createAction, props } from "@ngrx/store";
import { Annotation } from "src/assets/Data/Annotations";

// Strongly typed actions

export const emptyAction = createAction(
    'This is an empty action string'
);

export const emptyActionWithSelection = createAction(
    'Set current annotation',
    props<{annotation: Annotation}>()
);

