import { createAction, props } from "@ngrx/store";
import { } from "src/app/models/Annotations";
import { Material } from "src/app/models/Material";
import { Tag } from "src/app/models/Tag";

// Strongly typed actions

export const setMaterialId = createAction(
    '[Materials] Set Current materialId',
    props<{materialId: string}>()
);

export const setCurrentMaterial = createAction(
    '[App] Set Current Material value',
    props<{selcetedMaterial: Material}>()
);

export const LoadTagsSuccessForMaterial = createAction(
    '[Course] Tgas Successfully Loaded For Selected Material',
    props<{tags: Tag[]}>()
);

export const LoadTagsFailForMaterial = createAction(
    '[Course] Failed To Load Tags For Selected Material',
    props<{error: string}>()
);

