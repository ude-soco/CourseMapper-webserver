import { createAction, props } from "@ngrx/store";
import { User } from "../models/User";

export const toggleCourseSelected = createAction(
    '[App] Set course selected boolean value',
    props<{courseSelected: boolean}>()
);

export const setLoggedInUser = createAction(
    '[App] Set Logged In User',
    props<{loggedInUser: User}>()
);