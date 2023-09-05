import { createAction, props } from '@ngrx/store';
import { User } from '../models/User';
import { Course } from '../models/Course';
export const toggleCourseSelected = createAction(
  '[App] Set course selected boolean value',
  props<{ courseSelected: boolean }>()
);

export const setLoggedInUser = createAction(
  '[App] Set Logged In User',
  props<{ loggedInUser: User }>()
);

export const setSubscribedCourses = createAction(
  '[App] Set Subscribed Courses',
  props<{ subscribedCourses: Course[] }>()
);

export const setLastTimeCourseMapperOpened = createAction(
  '[App] Set Last Time Course Mapper Opened',
  props<{ lastTimeCourseMapperOpened: string }>()
);
