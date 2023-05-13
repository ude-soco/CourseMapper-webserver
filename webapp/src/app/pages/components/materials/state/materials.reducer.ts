import { createAction, createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state'
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions'
import {  } from 'src/app/models/Annotations';
import { Material } from 'src/app/models/Material';
import { Tag } from 'src/app/models/Tag';
import * as CourseAction from 'src/app/pages/courses/state/course.actions'
import { CourseState } from 'src/app/pages/courses/state/course.reducer';


export interface State extends AppState.State{
    materials: MaterialState;
}

export interface MaterialState {
  materialId: string,
  selectedMaterial:Material,
  tagsForMaterial: Tag[],
}

const initialState: MaterialState = {
materialId: null,
selectedMaterial:null,
tagsForMaterial: null,
}

const getMaterialFeatureState = createFeatureSelector<MaterialState>('material');

export const getCurrentMaterialId = createSelector(
  getMaterialFeatureState,
  state => state.materialId
);

export const getCurrentMaterial = createSelector(
  getMaterialFeatureState,
  state => state.selectedMaterial
);

export const getTagsForMaterial = createSelector(
  getMaterialFeatureState,
  state => state.tagsForMaterial
);

export const materialReducer = createReducer<MaterialState>(
    initialState,
    on(MaterialActions.setMaterialId, (state, action): MaterialState => {
      return {
        ...state,
        materialId: action.materialId
      };
    }),
    on(MaterialActions.setCurrentMaterial, (state, action): MaterialState => {
      return {
        
        ...state,
        selectedMaterial: action.selcetedMaterial
      };
    }),

    on(MaterialActions.LoadTagsSuccessForMaterial, (state, action): MaterialState => {
      return {
        
        ...state,
        tagsForMaterial: action.tags
      };
    }),
    on(CourseAction.setCurrentCourse, (state, action): MaterialState => {
      return {
        
        ...state,
        tagsForMaterial: null
        

      };
    }),
  );