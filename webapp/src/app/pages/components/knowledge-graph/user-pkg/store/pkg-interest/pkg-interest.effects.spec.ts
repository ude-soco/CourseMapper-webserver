import { TestBed } from '@angular/core/testing';
import { provideMockActions } from '@ngrx/effects/testing';
import { Observable, of, throwError } from 'rxjs';
import { PkgInterestEffects } from './pkg-interest.effects';
import * as PkgInterestActions from './pkg-interest.actions';
import { PkgService } from 'src/app/services/pkg.service';
import { InterestConcept } from '../../types/interest-level.types';
import { Action } from '@ngrx/store';
import { MockStore, provideMockStore } from '@ngrx/store/testing';

describe('PkgInterestEffects', () => {
  let actions$: Observable<Action>;
  let effects: PkgInterestEffects;
  let pkgService: jasmine.SpyObj<PkgService>;
  let store: MockStore;

  const mockConcepts: InterestConcept[] = [
    {
      conceptId: '1',
      conceptName: 'Test Concept',
      interestScore: 0.75,
    },
  ];

  beforeEach(() => {
    const pkgServiceSpy = jasmine.createSpyObj('PkgService', ['getInterestConcepts']);

    TestBed.configureTestingModule({
      providers: [
        PkgInterestEffects,
        provideMockActions(() => actions$),
        provideMockStore(),
        { provide: PkgService, useValue: pkgServiceSpy },
      ],
    });

    effects = TestBed.inject(PkgInterestEffects);
    pkgService = TestBed.inject(PkgService) as jasmine.SpyObj<PkgService>;
    store = TestBed.inject(MockStore);
  });

  describe('loadInterestGraph$', () => {
    it('should dispatch loadInterestGraphSuccess on successful load', (done) => {
      pkgService.getInterestConcepts.and.returnValue(of(mockConcepts));

      actions$ = of(
        PkgInterestActions.loadInterestGraph({ userId: 'user123', topN: 25 })
      );

      effects.loadInterestGraph$.subscribe((action) => {
        expect(action).toEqual(
          PkgInterestActions.loadInterestGraphSuccess({ concepts: mockConcepts })
        );
        expect(pkgService.getInterestConcepts).toHaveBeenCalledWith('user123', 25);
        done();
      });
    });

    it('should dispatch loadInterestGraphFailure on error', (done) => {
      const error = { message: 'Test error' };
      pkgService.getInterestConcepts.and.returnValue(throwError(() => error));

      actions$ = of(
        PkgInterestActions.loadInterestGraph({ userId: 'user123', topN: 25 })
      );

      effects.loadInterestGraph$.subscribe((action) => {
        expect(action).toEqual(
          PkgInterestActions.loadInterestGraphFailure({ error: 'Test error' })
        );
        done();
      });
    });
  });
});
