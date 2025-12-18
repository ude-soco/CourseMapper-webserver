import * as PkgInterestSelectors from './pkg-interest.selectors';
import { PkgInterestState } from './pkg-interest.reducer';
import { InterestConcept } from '../../types/interest-level.types';

describe('PkgInterest Selectors', () => {
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
    {
      conceptId: '3',
      conceptName: 'Graph Theory',
      interestScore: 0.65,
    },
  ];

  const mockState: PkgInterestState = {
    concepts: mockConcepts,
    loading: false,
    loaded: true,
    error: null,
    topN: 2,
    searchTerm: '',
  };

  describe('selectFilteredInterestConcepts', () => {
    it('should return all concepts when no filters applied', () => {
      const state = { ...mockState, topN: 'All' as const };
      const result = PkgInterestSelectors.selectFilteredInterestConcepts.projector(
        mockConcepts,
        '',
        'All'
      );

      expect(result).toEqual(mockConcepts);
    });

    it('should apply topN filter', () => {
      const result = PkgInterestSelectors.selectFilteredInterestConcepts.projector(
        mockConcepts,
        '',
        2
      );

      expect(result.length).toBe(2);
      expect(result[0].conceptId).toBe('1');
      expect(result[1].conceptId).toBe('2');
    });

    it('should apply search filter', () => {
      const result = PkgInterestSelectors.selectFilteredInterestConcepts.projector(
        mockConcepts,
        'data',
        'All'
      );

      expect(result.length).toBe(1);
      expect(result[0].conceptName).toBe('Data Structure');
    });

    it('should apply both topN and search filters', () => {
      const result = PkgInterestSelectors.selectFilteredInterestConcepts.projector(
        mockConcepts,
        'or',
        2
      );

      expect(result.length).toBe(1);
      expect(result[0].conceptName).toBe('Algorithm');
    });

    it('should be case-insensitive for search', () => {
      const result = PkgInterestSelectors.selectFilteredInterestConcepts.projector(
        mockConcepts,
        'GRAPH',
        'All'
      );

      expect(result.length).toBe(1);
      expect(result[0].conceptName).toBe('Graph Theory');
    });
  });
});
