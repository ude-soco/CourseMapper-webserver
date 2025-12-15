import * as PkgInterestActions from './pkg-interest.actions';
import { InterestConcept } from '../../types/interest-level.types';

describe('PkgInterest Actions', () => {
  const mockConcepts: InterestConcept[] = [
    {
      conceptId: '1',
      conceptName: 'Test Concept',
      interestScore: 0.75,
    },
  ];

  it('should create loadInterestGraph action', () => {
    const action = PkgInterestActions.loadInterestGraph({
      userId: 'user123',
      topN: 25,
    });
    
    expect(action.type).toBe('[PKG Interest] Load Interest Graph');
    expect(action.userId).toBe('user123');
    expect(action.topN).toBe(25);
  });

  it('should create loadInterestGraphSuccess action', () => {
    const action = PkgInterestActions.loadInterestGraphSuccess({
      concepts: mockConcepts,
    });
    
    expect(action.type).toBe('[PKG Interest] Load Interest Graph Success');
    expect(action.concepts).toEqual(mockConcepts);
  });

  it('should create loadInterestGraphFailure action', () => {
    const action = PkgInterestActions.loadInterestGraphFailure({
      error: 'Test error',
    });
    
    expect(action.type).toBe('[PKG Interest] Load Interest Graph Failure');
    expect(action.error).toBe('Test error');
  });

  it('should create setTopN action', () => {
    const action = PkgInterestActions.setTopN({ topN: 50 });
    
    expect(action.type).toBe('[PKG Interest] Set Top N');
    expect(action.topN).toBe(50);
  });

  it('should create setSearchTerm action', () => {
    const action = PkgInterestActions.setSearchTerm({ term: 'algorithm' });
    
    expect(action.type).toBe('[PKG Interest] Set Search Term');
    expect(action.term).toBe('algorithm');
  });

  it('should create clearInterestGraph action', () => {
    const action = PkgInterestActions.clearInterestGraph();
    
    expect(action.type).toBe('[PKG Interest] Clear Interest Graph');
  });
});
