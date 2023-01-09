import { createAction, props } from "@ngrx/store";
import { Material } from "src/app/models/Material";

// Strongly typed actions

export const setMaterialId: any = createAction(
    '[Materials] Set Current materialId',
    props<{materialId: string}>()
);

export const setCourseId: any = createAction(
    '[Materials] Set current courseId',
    props<{courseId: string}>()
);

export const setMouseEvent: any = createAction(
    '[Material] Set Mouse Event',
    props<{mouseEvent: MouseEvent}>()
);
