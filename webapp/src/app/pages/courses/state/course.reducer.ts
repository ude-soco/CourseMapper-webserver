import { createAction, createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state'
import * as CourseAction from 'src/app/pages/courses/state/course.actions'
import { Course } from 'src/app/models/Course';

export interface State extends AppState.State{
    courses: CourseState;
}
export interface CourseState {
    
    courseId: string,
    courseName: string,
    selectedCourse:Course,
    channelSelected:boolean,
 
  }
  const initialState: CourseState = {

  courseId: null,
  courseName:null,
  selectedCourse:null,
  channelSelected: false,
  }
  const getCourseFeatureState = createFeatureSelector<CourseState>('course');

  export const getCurrentCourse = createSelector(
    getCourseFeatureState,
    state => state.selectedCourse
  );

  export const getCurrentCourseId = createSelector(
    getCourseFeatureState,
    state => state.courseId
  );

  export const getChannelSelected = createSelector(
    getCourseFeatureState,
    state => state.channelSelected
  );

  export const courseReducer = createReducer<CourseState>(
    initialState,
    on(CourseAction.setCurrentCourse, (state, action): CourseState => {
      return {
        
        ...state,
        selectedCourse: action.selcetedCourse,
        

      };
    }),

    on(CourseAction.setCourseId, (state, action): CourseState => {
      return {
        ...state,
        courseId: action.courseId
      };
    }),

      on(CourseAction.toggleChannelSelected, (state, action): CourseState => {
        return {
          ...state,
          channelSelected: action.channelSelected
        };
      }),
  );