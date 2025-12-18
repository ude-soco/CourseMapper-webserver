import { pkgInterestReducer, PkgInterestState } from './pkg-interest.reducer';
import * as PkgInterestActions from './pkg-interest.actions';
import { InterestConcept } from '../../types/interest-level.types';

describe('PkgInterest Reducer', () => {
  const mockConcepts: InterestConcept[] = [
    {
      conceptId: '1',
      conceptName: 'Algorithm',
      interestScore: 0.85,
    },
    {
      conceptId: '2',
      conceptName: 'Data Structure',
      interestScore: 0.75,
    },
  ];

  const initialState: PkgInterestState = {
    concepts: [],
    loading: false,
    loaded: false,
    error: null,
    topN: 25,
    searchTerm: '',
  };

  it('should return the initial state', () => {
    const action = { type: 'Unknown' };
    const state = pkgInterestReducer(undefined, action);

    expect(state).toEqual(initialState);
  });

  describe('Load Interest Graph', () => {
    it('should set loading to true when loadInterestGraph is dispatched', () => {
      const action = PkgInterestActions.loadInterestGraph({
        userId: 'user123',
        topN: 25,
      });
      const state = pkgInterestReducer(initialState, action);

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set concepts and loaded when loadInterestGraphSuccess is dispatched', () => {
      const action = PkgInterestActions.loadInterestGraphSuccess({
        concepts: mockConcepts,
      });
      const state = pkgInterestReducer(initialState, action);

      expect(state.concepts).toEqual(mockConcepts);
      expect(state.loading).toBe(false);
      expect(state.loaded).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should set error when loadInterestGraphFailure is dispatched', () => {
      const action = PkgInterestActions.loadInterestGraphFailure({
        error: 'Failed to load',
      });
      const state = pkgInterestReducer(initialState, action);

      expect(state.loading).toBe(false);
      expect(state.loaded).toBe(false);
      expect(state.error).toBe('Failed to load');
    });
  });

  describe('Filters', () => {
    it('should update topN when setTopN is dispatched', () => {
      const action = PkgInterestActions.setTopN({ topN: 50 });
      const state = pkgInterestReducer(initialState, action);

      expect(state.topN).toBe(50);
    });

    it('should update searchTerm when setSearchTerm is dispatched', () => {
      const action = PkgInterestActions.setSearchTerm({ term: 'algo' });
      const state = pkgInterestReducer(initialState, action);

      expect(state.searchTerm).toBe('algo');
    });
  });

  describe('Clear', () => {
    it('should reset to initial state when clearInterestGraph is dispatched', () => {
      const loadedState: PkgInterestState = {
        concepts: mockConcepts,
        loading: false,
        loaded: true,
        error: null,
        topN: 50,
        searchTerm: 'test',
      };

      const action = PkgInterestActions.clearInterestGraph();
      const state = pkgInterestReducer(loadedState, action);

      expect(state).toEqual(initialState);
    });
  });
});
