import { createAction, createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state'
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'
import { Annotation, AnnotationTool, AnnotationType, PdfGeneralAnnotationLocation, PdfToolType } from 'src/app/models/Annotations';

// Strongly typed state
export interface State extends AppState.State{
    annotations: AnnotationState;
}

export interface AnnotationState {
  highlightSelected: boolean,
  selectedTool: PdfToolType,
  createAnnotationFromPanel: boolean,
  selectedAnnotationType: AnnotationType;
  annotationContent: string,
  isAnnotationPosted: boolean,
  annotation: Annotation,
  isAnnotationDialogVisible: boolean,
  isAnnotationCanceled: boolean,
  pdfSearchQuery: string
}

const initialState: AnnotationState = {
  highlightSelected: false,
  selectedTool: PdfToolType.None,
  createAnnotationFromPanel: true,
  selectedAnnotationType: null,
  annotationContent: null,
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
  pdfSearchQuery: null
}

const getAnnotationFeatureState = createFeatureSelector<AnnotationState>('annotation');

export const isHighlightSelected = createSelector(
  getAnnotationFeatureState,
  state => state.highlightSelected
);

export const getSelectedTool = createSelector(
  getAnnotationFeatureState,
  state => state.selectedTool
);

export const getCreateAnnotationFromPanel = createSelector(
  getAnnotationFeatureState,
  state => state.createAnnotationFromPanel
);

export const getSelectedAnnotationType = createSelector(
  getAnnotationFeatureState,
  state => state.selectedAnnotationType
);

export const getAnnotationContent = createSelector(
  getAnnotationFeatureState,
  state => state.annotationContent
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


export const annotationReducer = createReducer<AnnotationState>(
    initialState,
    on(AnnotationActions.toggleHighlightSelected, (state): AnnotationState => {
      return {
        ...state,
        highlightSelected: !state.highlightSelected
      };
    }),

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

    on(AnnotationActions.setSelectedAnnotationType, (state, action): AnnotationState => {
      return {
        ...state,
        selectedAnnotationType: action.selectedAnnotationType
      };
    }),

    on(AnnotationActions.setAnnotationContent, (state, action): AnnotationState => {
      return {
        ...state,
        annotationContent: action.annotationContent
      };
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
  );