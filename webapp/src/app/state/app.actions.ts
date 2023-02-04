import { createAction, props } from "@ngrx/store";

export const toggleCourseSelected = createAction(
    '[App] Set course selected boolean value',
    props<{courseSelected: boolean}>()
);