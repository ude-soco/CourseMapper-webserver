import { createAction, props } from '@ngrx/store';
import { InterestConcept } from '../../types/interest-level.types';

// Load Interest Graph
export const loadInterestGraph = createAction(
  '[PKG Interest] Load Interest Graph',
  props<{ userId: string; topN: number | 'All' }>()
);

export const loadInterestGraphSuccess = createAction(
  '[PKG Interest] Load Interest Graph Success',
  props<{ concepts: InterestConcept[] }>()
);

export const loadInterestGraphFailure = createAction(
  '[PKG Interest] Load Interest Graph Failure',
  props<{ error: string }>()
);

// Filter Actions
export const setTopN = createAction(
  '[PKG Interest] Set Top N',
  props<{ topN: number | 'All' }>()
);

export const setSearchTerm = createAction(
  '[PKG Interest] Set Search Term',
  props<{ term: string }>()
);

// Clear state
export const clearInterestGraph = createAction(
  '[PKG Interest] Clear Interest Graph'
);
