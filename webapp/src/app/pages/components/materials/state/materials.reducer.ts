import { createAction, createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as AppState from 'src/app/state/app.state'
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions'
import {  } from 'src/app/models/Annotations';
import { Material } from 'src/app/models/Material';


export interface State extends AppState.State{
    materials: MaterialState;
}

export interface MaterialState {
  materialId: string,
  selectedMaterial:Material
}

const initialState: MaterialState = {
materialId: null,
selectedMaterial:null
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
  );