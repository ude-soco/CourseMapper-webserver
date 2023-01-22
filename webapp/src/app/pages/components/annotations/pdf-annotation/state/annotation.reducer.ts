import { createAction, createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state'
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'
import { Annotation, AnnotationTool, AnnotationType, PdfGeneralAnnotationLocation, PdfToolType } from 'src/app/models/Annotations';

// Strongly typed state
export interface State extends AppState.State{
    annotations: AnnotationState;
}

export interface AnnotationState {
  selectedTool: PdfToolType,
  createAnnotationFromPanel: boolean,
  isAnnotationPosted: boolean,
  annotation: Annotation,
  isAnnotationDialogVisible: boolean,
  isAnnotationCanceled: boolean,
  pdfSearchQuery: string,
  pdfZoom: number,
  pdfCurrentPage: number
}

const initialState: AnnotationState = {
  selectedTool: PdfToolType.None,
  createAnnotationFromPanel: true,
  isAnnotationPosted: false,
  annotation: {
    type: null,
    content: null,
    location: null,
    tool: null,
    materialID: null,
    courseId: null,
  },
  isAnnotationDialogVisible: false,
  isAnnotationCanceled: false,
  pdfSearchQuery: null,
  pdfZoom: 1,
  pdfCurrentPage: 1
}

const getAnnotationFeatureState = createFeatureSelector<AnnotationState>('annotation');

export const getSelectedTool = createSelector(
  getAnnotationFeatureState,
  state => state.selectedTool
);

export const getCreateAnnotationFromPanel = createSelector(
  getAnnotationFeatureState,
  state => state.createAnnotationFromPanel
);

export const getIsAnnotationPosted = createSelector(
  getAnnotationFeatureState,
  state => state.isAnnotationPosted
);

export const getAnnotationProperties = createSelector(
  getAnnotationFeatureState,
  state => state.annotation
);

export const getIsAnnotationDialogVisible = createSelector(
  getAnnotationFeatureState,
  state => state.isAnnotationDialogVisible
);

export const getIsAnnotationCanceled = createSelector(
  getAnnotationFeatureState,
  state => state.isAnnotationCanceled
);

export const getPdfSearchQuery = createSelector(
  getAnnotationFeatureState,
  state => state.pdfSearchQuery
);

export const getPdfZoom = createSelector(
  getAnnotationFeatureState,
  state => state.pdfZoom
);


export const annotationReducer = createReducer<AnnotationState>(
    initialState,

    on(AnnotationActions.setSelectedTool, (state, action): AnnotationState => {
      return {
        ...state,
        selectedTool: action.selectedTool
      };
    }),

    on(AnnotationActions.setCreateAnnotationFromPanel, (state, action): AnnotationState => {
      if(action.createAnnotationFromPanel){
        return {
          ...state,
          createAnnotationFromPanel: action.createAnnotationFromPanel,
          isAnnotationCanceled: false
        };
      }else{
        return {
          ...state,
          createAnnotationFromPanel: action.createAnnotationFromPanel
        };
      }
    }),

    on(AnnotationActions.setAnnotationProperties, (state, action): AnnotationState => {
      return {
        ...state,
        annotation: action.annotation
      };
    }),

    on(AnnotationActions.postAnnotationSuccess, (state, action): AnnotationState => {
      return {
        ...state,
        isAnnotationDialogVisible: false,
        isAnnotationPosted: true,
        isAnnotationCanceled: false
      };
    }),

    on(AnnotationActions.postAnnotationFail, (state, action): AnnotationState => {
      return {
        ...state,
        isAnnotationDialogVisible: false,
        isAnnotationPosted: false,
        isAnnotationCanceled: true
      };
    }),

    on(AnnotationActions.setIsAnnotationDialogVisible, (state, action): AnnotationState => {
      return {
        ...state,
        isAnnotationDialogVisible: action.isAnnotationDialogVisible
      };
    }),
    
    on(AnnotationActions.setIsAnnotationCanceled, (state, action): AnnotationState => {
      if(action.isAnnotationCanceled){
        return {
          ...state,
          isAnnotationCanceled: true,
          isAnnotationPosted: false,
          isAnnotationDialogVisible: false
        };
      }else{
        return {
          ...state,
          isAnnotationCanceled: false
        };
      }
    }),

    on(AnnotationActions.setPdfSearchQuery, (state, action): AnnotationState => {
      return {
        ...state,
        pdfSearchQuery: action.pdfSearchQuery
      };
    }),

    on(AnnotationActions.setZoomIn, (state): AnnotationState => {
      return {
        ...state,
        pdfZoom: state.pdfZoom + 0.25
      };
    }),

    on(AnnotationActions.setZoomOut, (state): AnnotationState => {
      return {
        ...state,
        pdfZoom: state.pdfZoom - 0.25
      };
    }),

    on(AnnotationActions.resetZoom, (state): AnnotationState => {
      return {
        ...state,
        pdfZoom: 1
      };
    }),
  );