import { createAction, props } from "@ngrx/store";
import { Course } from "src/app/models/Course";

export const setCurrentCourse = createAction(
    '[App] Set Current Course value',
    props<{selcetedCourse: Course}>()
);

export const setCurrentCourseID = createAction(
    '[App] Set Current Course ID',
    props<{selcetedCourseID: string}>()
);