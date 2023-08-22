import {
  createFeatureSelector,
  createReducer,
  createSelector,
  INIT,
  on,
} from '@ngrx/store';
import * as AppActions from 'src/app/state/app.actions';
import * as AppState from 'src/app/state/app.state';
import { User } from '../models/User';

export interface State extends AppState.State {
  generalState: GeneralState;
}

export interface GeneralState {
  courseSelected: boolean;
  loggedInUser: User;
  subscribedCourses?: { name: string; id: string }[];
}

const initialState: GeneralState = {
  courseSelected: false,
  loggedInUser: null,
  subscribedCourses: [],
};

const getAppFeatureState = createFeatureSelector<GeneralState>('general');

export const getCourseSelected = createSelector(
  getAppFeatureState,
  (state) => state.courseSelected
);

export const getLoggedInUser = createSelector(
  getAppFeatureState,
  (state) => state.loggedInUser
);

export const getSubscribedCourses = createSelector(
  getAppFeatureState,
  (state) => state.subscribedCourses
);

export const appReducer = createReducer<GeneralState>(
  initialState,
  on(AppActions.toggleCourseSelected, (state, action): GeneralState => {
    return {
      ...state,
      courseSelected: action.courseSelected,
    };
  }),

  on(AppActions.setLoggedInUser, (state, action): GeneralState => {
    return {
      ...state,
      loggedInUser: action.loggedInUser,
    };
  }),
  on(AppActions.setSubscribedCourses, (state, action): GeneralState => {
    return {
      ...state,
      subscribedCourses: action.subscribedCourses.map((course) => {
        return { name: course.name, id: course._id };
      }),
    };
  })
);
