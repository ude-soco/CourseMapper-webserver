import { createAction, createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state'
import * as CourseAction from 'src/app/pages/courses/state/course.actions'
import { Course } from 'src/app/models/Course';
import { Channel } from 'src/app/models/Channel';
import { Tag } from 'src/app/models/Tag';
import { Topic } from 'src/app/models/Topic';
import { Annotation } from 'src/app/models/Annotations';

export interface State extends AppState.State{
    courses: CourseState;
}
export interface CourseState {
    
    courseId: string,
    selectedCourse:Course,
    channelSelected:boolean,
    selectedChannel: Channel,
    tagsForCourse: Tag[],
    tagsForTopic: Tag[],
    tagsForChannel: Tag[],
    tagSelected: boolean,
    selectedTag: Tag,
    selcetedTopic: Topic,
    annotationsForSelectedTag: Annotation[]
 
  }
  const initialState: CourseState = {

  courseId: null,
  selectedCourse:null,
  channelSelected: false,
  selectedChannel: null,
  tagsForCourse: null,
  tagsForTopic: null,
  tagsForChannel: null,
  tagSelected: false,
  selectedTag: null,
  selcetedTopic: null,
  annotationsForSelectedTag: null
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

  export const getTagsForCourse = createSelector(
    getCourseFeatureState,
    state => state.tagsForCourse
  );

  export const getTagsForTopic = createSelector(
    getCourseFeatureState,
    state => state.tagsForTopic
  );

  export const getTagsForChannel = createSelector(
    getCourseFeatureState,
    state => state.tagsForChannel
  );

  export const getIsTagSelected = createSelector(
    getCourseFeatureState,
    state => state.tagSelected
  );

  export const getAnnotationsForSelectedTag = createSelector(
    getCourseFeatureState,
    state => state.annotationsForSelectedTag
  );

  export const getSelectedTag = createSelector(
    getCourseFeatureState,
    state => state.selectedTag
  );


  export const courseReducer = createReducer<CourseState>(
    initialState,
    on(CourseAction.setCurrentCourse, (state, action): CourseState => {
      return {
        
        ...state,
        selectedCourse: action.selcetedCourse,
        tagSelected: false,
        selectedTag: null
        

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

      on(CourseAction.selectTag, (state, action): CourseState => {
        return {
          ...state,
          tagSelected: action.tagSelected
        };
      }),

      on(CourseAction.loadAnnotationsForSelectedTag, (state, action): CourseState => {
        return {
          ...state,
          tagSelected: action.tagSelected,
          selectedTag: action.selectedTag
        };
      }),

      on(CourseAction.LoadTagsSuccess, (state, action): CourseState => {
        switch(action.tagsFor){
          case 'course':{
            return {
              ...state,
              tagsForCourse: action.tags
            };
          }
          case 'topic':{
            return {
              ...state,
              tagsForTopic: action.tags
            };
          }
          case 'channel':{
            return {
              ...state,
              tagsForChannel: action.tags
            };
          }
          default:{
            return {
              ...state,
              tagsForCourse: action.tags
            };
          }
        }
      }),

      on(CourseAction.setCurrentTopic, (state, action): CourseState => {
        return {
          ...state,
          selcetedTopic: action.selcetedTopic
        };
      }),
  );