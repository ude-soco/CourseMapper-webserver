import { createAction, createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state'
import * as CourseAction from 'src/app/pages/courses/state/course.actions'
import { Course } from 'src/app/models/Course';
import { Channel } from 'src/app/models/Channel';
import { Tag } from 'src/app/models/Tag';
import { Topic } from 'src/app/models/Topic';

export interface State extends AppState.State{
    courses: CourseState;
}
export interface CourseState {
    
    courseId: string,
    selectedCourse:Course,
    channelSelected:boolean,
    selectedChannel: Channel,
    tags: Tag[],
    tagSelected: boolean,
    selcetedTopic: Topic
 
  }
  const initialState: CourseState = {

  courseId: null,
  selectedCourse:null,
  channelSelected: false,
  selectedChannel: null,
  tags: null,
  tagSelected: false,
  selcetedTopic: null
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

  export const getSelectedChannel = createSelector(
    getCourseFeatureState,
    state => state.selectedChannel
  );

  export const getSelectedTopic = createSelector(
    getCourseFeatureState,
    state => state.selcetedTopic
  );

  export const getTagsForChannel = createSelector(
    getCourseFeatureState,
    state => state.tags
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

      on(CourseAction.SetSelectedChannel, (state, action): CourseState => {
        return {
          ...state,
          selectedChannel: action.selectedChannel
        };
      }),

      on(CourseAction.LoadTagsSuccess, (state, action): CourseState => {
        return {
          ...state,
          tags: action.tags
        };
      }),

      on(CourseAction.setCurrentTopic, (state, action): CourseState => {
        return {
          ...state,
          selcetedTopic: action.selcetedTopic
        };
      }),
  );