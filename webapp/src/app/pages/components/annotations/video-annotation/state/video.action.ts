import { createAction, props } from "@ngrx/store";

export const setIsBrushSelectionActive = createAction(
    '[Video] Set Is Brush Selection Active',
    props<{ isBrushSelectionActive: boolean}>()
);