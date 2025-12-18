import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, switchMap, catchError, withLatestFrom } from 'rxjs/operators';
import * as PkgInterestActions from './pkg-interest.actions';
import * as PkgInterestSelectors from './pkg-interest.selectors';
import { PkgService } from '../../../../../../services/pkg.service';
import { InterestConcept } from '../../types/interest-level.types';

@Injectable()
export class PkgInterestEffects {
  constructor(
    private actions$: Actions,
    private pkgService: PkgService,
    private store: Store
  ) {}

  // Load Interest Graph
  loadInterestGraph$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PkgInterestActions.loadInterestGraph),
      switchMap(({ userId, topN }) =>
        this.pkgService.getInterestConcepts(userId, topN).pipe(
          map((concepts: InterestConcept[]) => {
            console.log('[PKG Interest Effects] Loaded concepts:', concepts.length);
            return PkgInterestActions.loadInterestGraphSuccess({ concepts });
          }),
          catchError((error) => {
            const errorMessage = error?.error?.error || error?.message || 'Failed to load interest graph';
            console.error('[PKG Interest Effects] Error:', errorMessage);
            return of(PkgInterestActions.loadInterestGraphFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  // Reload when Top N changes
  reloadOnTopNChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PkgInterestActions.setTopN),
      withLatestFrom(this.store.select(PkgInterestSelectors.selectInterestLoaded)),
      switchMap(([{ topN }, loaded]) => {
        // Only reload if data was previously loaded
        // The component will handle initial load
        if (!loaded) {
          return of({ type: '[PKG Interest] No-op' });
        }
        
        // For now, we don't reload from server when topN changes
        // The filtering is done client-side via selector
        // If you want server-side filtering, dispatch loadInterestGraph here
        return of({ type: '[PKG Interest] No-op' });
      })
    )
  );
}
