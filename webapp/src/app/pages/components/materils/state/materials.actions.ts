import { createAction, props } from "@ngrx/store";
import { } from "src/app/models/Annotations";
import { Material } from "src/app/models/Material";

// Strongly typed actions

export const setMaterialId = createAction(
    '[Materials] Set Current materialId',
    props<{materialId: string}>()
);

export const setCurrentMaterial = createAction(
    '[App] Set Current Material value',
    props<{selcetedMaterial: Material}>()
);

