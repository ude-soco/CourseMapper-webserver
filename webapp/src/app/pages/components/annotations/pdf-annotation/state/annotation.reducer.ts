import {
  createAction,
  createFeatureSelector,
  createReducer,
  createSelector,
  on,
} from '@ngrx/store';
import * as AppState from 'src/app/state/app.state';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import {
  Annotation,
  AnnotationTool,
  AnnotationType,
  PdfGeneralAnnotationLocation,
  PdfToolType,
} from 'src/app/models/Annotations';

// Strongly typed state
export interface State extends AppState.State {
  annotations: AnnotationState;
}

export interface AnnotationState {
  selectedTool: PdfToolType;
  createAnnotationFromPanel: boolean;
  isAnnotationPosted: boolean;
  annotation: Annotation;
  isAnnotationDialogVisible: boolean;
  isAnnotationCanceled: boolean;
  pdfSearchQuery: string;
  pdfZoom: number;
  pdfCurrentPage: number;
  pdfTotalPages: number;
  annotationsForMaterial: Annotation[];
  hideAnnotations: boolean;
  selectedDrawingTool: string;
  selectedLineHeight: number;
  showDrawBoxTools: boolean;
  showAllPDFAnnotations: boolean;
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
    materialId: null,
    courseId: null,
  },
  isAnnotationDialogVisible: false,
  isAnnotationCanceled: false,
  pdfSearchQuery: null,
  pdfZoom: 1,
  pdfCurrentPage: 1,
  pdfTotalPages: null,
  annotationsForMaterial: [],
  hideAnnotations: false,
  selectedDrawingTool: null,
  selectedLineHeight: 2,
  showDrawBoxTools: false,
  showAllPDFAnnotations: false,
};

const getAnnotationFeatureState =
  createFeatureSelector<AnnotationState>('annotation');

export const getSelectedTool = createSelector(
  getAnnotationFeatureState,
  (state) => state.selectedTool
);

export const getCreateAnnotationFromPanel = createSelector(
  getAnnotationFeatureState,
  (state) => state.createAnnotationFromPanel
);

export const getIsAnnotationPosted = createSelector(
  getAnnotationFeatureState,
  (state) => state.isAnnotationPosted
);

export const getAnnotationProperties = createSelector(
  getAnnotationFeatureState,
  (state) => state.annotation
);

export const getIsAnnotationDialogVisible = createSelector(
  getAnnotationFeatureState,
  (state) => state.isAnnotationDialogVisible
);

export const getIsAnnotationCanceled = createSelector(
  getAnnotationFeatureState,
  (state) => state.isAnnotationCanceled
);

export const getPdfSearchQuery = createSelector(
  getAnnotationFeatureState,
  (state) => state.pdfSearchQuery
);

export const getPdfZoom = createSelector(
  getAnnotationFeatureState,
  (state) => state.pdfZoom
);

export const getAnnotationsForMaterial = createSelector(
  getAnnotationFeatureState,
  (state) => state.annotationsForMaterial
);

export const getHideAnnotationValue = createSelector(
  getAnnotationFeatureState,
  (state) => state.hideAnnotations
);

export const getCurrentPdfPage = createSelector(
  getAnnotationFeatureState,
  (state) => state.pdfCurrentPage
);

export const getPdfTotalNumberOfPages = createSelector(
  getAnnotationFeatureState,
  (state) => state.pdfTotalPages
);

export const getSelectedDrawingTool = createSelector(
  getAnnotationFeatureState,
  (state) => state.selectedDrawingTool
);

export const getSelectedDrawingLineHeight = createSelector(
  getAnnotationFeatureState,
  (state) => state.selectedLineHeight
);

export const showDrawBoxTools = createSelector(
  getAnnotationFeatureState,
  (state) => state.showDrawBoxTools
);

export const getshowAllPDFAnnotations = createSelector(
  getAnnotationFeatureState,
  (state) => state.showAllPDFAnnotations
);

const getUsernameOfReplyAuthors = createSelector(
  getAnnotationFeatureState,
  (state) => {
    let usernamesAndNamesMap: Map<string, string> = new Map<string, string>();
    state.annotationsForMaterial.forEach((annotation) => {
      annotation.replies.forEach((reply) => {
        usernamesAndNamesMap.set(reply.author.username, reply.author.name);
      });
    });
    return usernamesAndNamesMap;
  }
);

const getUsernameOfAnnotationAuthors = createSelector(
  getAnnotationFeatureState,
  (state) => {
    let usernamesAndNamesMap: Map<string, string> = new Map<string, string>();
    state.annotationsForMaterial.forEach((annotation) => {
      usernamesAndNamesMap.set(
        annotation.author.username,
        annotation.author.name
      );
    });
    return usernamesAndNamesMap;
  }
);

export const getUnionOfAnnotationAndReplyAuthors = createSelector(
  getUsernameOfReplyAuthors,
  getUsernameOfAnnotationAuthors,
  (replyAuthors, annotationAuthors) => {
    let unionOfAuthors = new Map<string, string>();
    replyAuthors.forEach((value, key) => {
      unionOfAuthors.set(key, value);
    });
    annotationAuthors.forEach((value, key) => {
      unionOfAuthors.set(key, value);
    });
    let arr: { name: string; username: string }[];
    arr = Array.from(unionOfAuthors, ([name, username]) => ({
      name,
      username,
    }));
    return arr;
  }
);

export const annotationReducer = createReducer<AnnotationState>(
  initialState,

  on(AnnotationActions.setSelectedTool, (state, action): AnnotationState => {
    return {
      ...state,
      selectedTool: action.selectedTool,
    };
  }),

  on(
    AnnotationActions.setCreateAnnotationFromPanel,
    (state, action): AnnotationState => {
      if (action.createAnnotationFromPanel) {
        return {
          ...state,
          createAnnotationFromPanel: action.createAnnotationFromPanel,
          isAnnotationCanceled: false,
        };
      } else {
        return {
          ...state,
          createAnnotationFromPanel: action.createAnnotationFromPanel,
        };
      }
    }
  ),

  on(
    AnnotationActions.setAnnotationProperties,
    (state, action): AnnotationState => {
      return {
        ...state,
        annotation: action.annotation,
      };
    }
  ),

  on(
    AnnotationActions.postAnnotationSuccess,
    (state, action): AnnotationState => {
      return {
        ...state,
        isAnnotationDialogVisible: false,
        isAnnotationPosted: true,
        isAnnotationCanceled: false,
        createAnnotationFromPanel: true,
        selectedTool: PdfToolType.None,
        showDrawBoxTools: false,
      };
    }
  ),

  on(AnnotationActions.postAnnotationFail, (state, action): AnnotationState => {
    return {
      ...state,
      isAnnotationDialogVisible: false,
      isAnnotationPosted: false,
      isAnnotationCanceled: true,
      createAnnotationFromPanel: true,
    };
  }),

  on(
    AnnotationActions.setIsAnnotationDialogVisible,
    (state, action): AnnotationState => {
      return {
        ...state,
        isAnnotationDialogVisible: action.isAnnotationDialogVisible,
      };
    }
  ),

  on(
    AnnotationActions.setIsAnnotationCanceled,
    (state, action): AnnotationState => {
      if (action.isAnnotationCanceled) {
        return {
          ...state,
          isAnnotationCanceled: true,
          isAnnotationPosted: false,
          isAnnotationDialogVisible: false,
        };
      } else {
        return {
          ...state,
          isAnnotationCanceled: false,
        };
      }
    }
  ),

  on(AnnotationActions.setPdfSearchQuery, (state, action): AnnotationState => {
    return {
      ...state,
      pdfSearchQuery: action.pdfSearchQuery,
    };
  }),

  on(AnnotationActions.setZoomIn, (state): AnnotationState => {
    return {
      ...state,
      pdfZoom: state.pdfZoom + 0.25,
    };
  }),

  on(AnnotationActions.setZoomOut, (state): AnnotationState => {
    return {
      ...state,
      pdfZoom: state.pdfZoom - 0.25,
    };
  }),

  on(AnnotationActions.resetZoom, (state): AnnotationState => {
    return {
      ...state,
      pdfZoom: 1,
    };
  }),

  on(
    AnnotationActions.loadAnnotationsSuccess,
    (state, action): AnnotationState => {
      return {
        ...state,
        annotationsForMaterial: action.annotations,
      };
    }
  ),

  on(AnnotationActions.postAnnotationFail, (state, action): AnnotationState => {
    return {
      ...state,
      annotationsForMaterial: [],
    };
  }),

  on(
    AnnotationActions.toggleShowHideAnnotation,
    (state, action): AnnotationState => {
      return {
        ...state,
        hideAnnotations: !state.hideAnnotations,
      };
    }
  ),

  on(
    AnnotationActions.resetAnnotationStoreValues,
    (state, action): AnnotationState => {
      return initialState;
    }
  ),

  on(AnnotationActions.setCurrentPdfPage, (state, action): AnnotationState => {
    return {
      ...state,
      pdfCurrentPage: action.pdfCurrentPage,
    };
  }),

  on(AnnotationActions.setPdfTotalPages, (state, action): AnnotationState => {
    return {
      ...state,
      pdfTotalPages: action.pdfTotalPages,
    };
  }),

  on(
    AnnotationActions.updateAnnotationsWithReplies,
    (state, action): AnnotationState => {
      return {
        ...state,
        annotationsForMaterial: action.annotations,
      };
    }
  ),

  on(
    AnnotationActions.setSelectedDrawingTool,
    (state, action): AnnotationState => {
      return {
        ...state,
        selectedDrawingTool: action.tool,
      };
    }
  ),

  on(
    AnnotationActions.setSelectedDrawingLineHeight,
    (state, action): AnnotationState => {
      return {
        ...state,
        selectedLineHeight: action.height,
      };
    }
  ),

  on(
    AnnotationActions.setshowAllPDFAnnotations,
    (state, action): AnnotationState => {
      return {
        ...state,
        showAllPDFAnnotations: action.showAllPDFAnnotations,
      };
    }
  ),

  on(
    AnnotationActions.setShowDrawBoxTools,
    (state, action): AnnotationState => {
      if (action.show) {
        return {
          ...state,
          showDrawBoxTools: action.show,
          selectedTool: PdfToolType.DrawBox,
        };
      } else {
        return {
          ...state,
          showDrawBoxTools: action.show,
          selectedTool: PdfToolType.None,
        };
      }
    }
  ),

  on(
    AnnotationActions.updateAnnotationsOnSocketEmit,
    (state, action): AnnotationState => {
      switch (action.payload.eventType) {
        case 'annotationCreated': {
          return {
            ...state,
            annotationsForMaterial: [
              action.payload.annotation,
              ...state.annotationsForMaterial,
            ] as Annotation[],
          };
        }
        case 'annotationLiked': {
          let annotations = [...state.annotationsForMaterial];
          let index = state.annotationsForMaterial.findIndex(
            (annotation) => annotation._id == action.payload.annotation._id
          );
          let updatedLikes = [...annotations[index].likes];
          let updatedDislikes = [...annotations[index].dislikes];
          updatedLikes = action.payload.annotation.likes;
          updatedDislikes = action.payload.annotation.dislikes;
          let updatedAnnotation = {
            ...annotations[index],
            likes: updatedLikes,
            dislikes: updatedDislikes,
          } as Annotation;
          annotations[index] = updatedAnnotation;
          return {
            ...state,
            annotationsForMaterial: annotations,
          };
        }
        case 'annotationUnliked': {
          let annotations = [...state.annotationsForMaterial];
          let index = state.annotationsForMaterial.findIndex(
            (annotation) => annotation._id == action.payload.annotation._id
          );
          let updatedLikes = [...annotations[index].likes];
          let updatedDislikes = [...annotations[index].dislikes];
          updatedLikes = action.payload.annotation.likes;
          updatedDislikes = action.payload.annotation.dislikes;
          let updatedAnnotation = {
            ...annotations[index],
            likes: updatedLikes,
            dislikes: updatedDislikes,
          } as Annotation;
          annotations[index] = updatedAnnotation;
          return {
            ...state,
            annotationsForMaterial: annotations,
          };
        }
        case 'annotationUndisliked': {
          let annotations = [...state.annotationsForMaterial];
          let index = state.annotationsForMaterial.findIndex(
            (annotation) => annotation._id == action.payload.annotation._id
          );
          let updatedLikes = [...annotations[index].likes];
          let updatedDislikes = [...annotations[index].dislikes];
          updatedLikes = action.payload.annotation.likes;
          updatedDislikes = action.payload.annotation.dislikes;
          let updatedAnnotation = {
            ...annotations[index],
            likes: updatedLikes,
            dislikes: updatedDislikes,
          } as Annotation;
          annotations[index] = updatedAnnotation;
          return {
            ...state,
            annotationsForMaterial: annotations,
          };
        }
        case 'annotationDisliked': {
          let annotations = [...state.annotationsForMaterial];
          let index = state.annotationsForMaterial.findIndex(
            (annotation) => annotation._id == action.payload.annotation._id
          );
          let updatedLikes = [...annotations[index].likes];
          let updatedDislikes = [...annotations[index].dislikes];
          updatedLikes = action.payload.annotation.likes;
          updatedDislikes = action.payload.annotation.dislikes;
          let updatedAnnotation = {
            ...annotations[index],
            likes: updatedLikes,
            dislikes: updatedDislikes,
          } as Annotation;
          annotations[index] = updatedAnnotation;
          return {
            ...state,
            annotationsForMaterial: annotations,
          };
        }
        case 'replyCreated': {
          let annotations = [...state.annotationsForMaterial];
          let index = state.annotationsForMaterial.findIndex(
            (annotation) => annotation._id === action.payload.annotation._id
          );
          let annotation = annotations.find(
            (annotation) => annotation._id === action.payload.annotation._id
          );
          let replies = [...annotation.replies];
          //Check if reply already exists:
          let exists = replies.some(
            (reply) => reply._id === action.payload.reply._id
          );
          if (!exists) {
            let updatedReplies = [...replies, action.payload.reply];
            let updatedAnnotation = {
              ...annotation,
              replies: updatedReplies,
            } as Annotation;
            annotations[index] = updatedAnnotation;
          }
          return {
            ...state,
            annotationsForMaterial: annotations,
          };
        }
        case 'replyDeleted': {
          let annotations = [...state.annotationsForMaterial];
          let index = state.annotationsForMaterial.findIndex(
            (annotation) => annotation._id === action.payload.annotation._id
          );
          let annotation = annotations.find(
            (annotation) => annotation._id === action.payload.annotation._id
          );
          let replies = [...annotation.replies];
          //Check if reply already exists:
          let exists = replies.some(
            (reply) => reply._id === action.payload.reply._id
          );
          if (exists) {
            replies.forEach((reply, index) => {
              if (reply._id === action.payload.reply._id)
                replies.splice(index, 1);
            });
            let updatedReplies = [...replies];
            let updatedAnnotation = {
              ...annotation,
              replies: updatedReplies,
            } as Annotation;
            annotations[index] = updatedAnnotation;
          }
          return {
            ...state,
            annotationsForMaterial: annotations,
          };
        }
        case 'replyEdited': {
          let annotations = [...state.annotationsForMaterial];
          let index = state.annotationsForMaterial.findIndex(
            (annotation) => annotation._id === action.payload.annotation._id
          );
          let annotation = annotations.find(
            (annotation) => annotation._id === action.payload.annotation._id
          );
          let replies = [...annotation.replies];
          //Check if reply already exists:
          let replyIndex = replies.findIndex(
            (reply) => reply._id === action.payload.reply._id
          );
          replies[replyIndex] = action.payload.reply;
          if (replies[replyIndex]) {
            let updatedReplies = [...replies];
            let updatedAnnotation = {
              ...annotation,
              replies: updatedReplies,
            } as Annotation;
            annotations[index] = updatedAnnotation;
          }
          return {
            ...state,
            annotationsForMaterial: annotations,
          };
        }
        case 'annotationDeleted': {
          let annotations = [...state.annotationsForMaterial];
          annotations.forEach((anno, index) => {
            if (anno._id === action.payload.annotation._id)
              annotations.splice(index, 1);
          });
          return {
            ...state,
            annotationsForMaterial: annotations,
          };
        }
        case 'annotationEdited': {
          let annotations = [...state.annotationsForMaterial];
          let index = annotations.findIndex(
            (anno) => anno._id == action.payload.annotation._id
          );
          annotations[index] = {
            ...annotations[index],
            content: action.payload.annotation.content,
          };
          return {
            ...state,
            annotationsForMaterial: annotations,
          };
        }
        default: {
          return {
            ...state,
          };
        }
      }
    }
  )
);
