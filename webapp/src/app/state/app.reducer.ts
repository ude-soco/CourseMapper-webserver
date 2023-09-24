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
  lastTimeCourseMapperOpened: string;
  showNotificationsPanel: boolean;
  showPopupMessage: boolean;
  popupMessage: string;
}

const initialState: GeneralState = {
  courseSelected: false,
  loggedInUser: null,
  subscribedCourses: [],
  lastTimeCourseMapperOpened: null,
  showNotificationsPanel: false,
  showPopupMessage: false,
  popupMessage: null,
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

export const getLastTimeCourseMapperOpened = createSelector(
  getAppFeatureState,
  (state) => state.lastTimeCourseMapperOpened
);

export const getShowNotificationsPanel = createSelector(
  getAppFeatureState,
  (state) => state.showNotificationsPanel
);

export const getShowPopupMessage = createSelector(
  getAppFeatureState,
  (state) => {
    return {
      showPopupMessage: state.showPopupMessage,
      popupMessage: state.popupMessage,
    };
  }
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
  }),
  on(
    AppActions.getLastTimeCourseMapperOpenedSuccess,
    (state, action): GeneralState => {
      return {
        ...state,
        lastTimeCourseMapperOpened: action.lastTimeCourseMapperOpened,
      };
    }
  ),
  on(AppActions.removeLoggedInUser, (state): GeneralState => {
    return {
      ...state,
      loggedInUser: null,
    };
  }),
  on(AppActions.setShowNotificationsPanel, (state, action): GeneralState => {
    return {
      ...state,
      showNotificationsPanel: action.showNotificationsPanel,
    };
  }),
  on(AppActions.setShowPopupMessage, (state, action): GeneralState => {
    return {
      ...state,
      showPopupMessage: action.showPopupMessage,
      popupMessage: action.popupMessage,
    };
  })
);
