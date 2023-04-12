import { createAction, props } from "@ngrx/store";
import { Course } from "src/app/models/Course";

export const setCurrentCourse = createAction(
    '[Course] Set Current Course value',
    props<{selcetedCourse: Course}>()
);

export const setCourseId = createAction(
    '[Course] Set current courseId',
    props<{courseId: string}>()
);

export const toggleChannelSelected = createAction(
    '[Course] Set channel selected boolean value',
    props<{channelSelected: boolean}>()
);