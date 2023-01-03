import { createAction, props } from "@ngrx/store";
import { Material } from "src/app/models/Material";

// Strongly typed actions

export const emptyAction = createAction(
    'This is an empty action string'
);

export const emptyActionWithSelection = createAction(
    'Set current annotation',
    props<{material: Material}>()
);

