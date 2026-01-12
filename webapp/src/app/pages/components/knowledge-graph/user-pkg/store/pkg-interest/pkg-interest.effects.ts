import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, switchMap, catchError, withLatestFrom, tap } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import * as PkgInterestActions from './pkg-interest.actions';
import * as PkgInterestSelectors from './pkg-interest.selectors';
import { PkgService } from '../../../../../../services/pkg.service';
import { InterestConcept } from '../../types/interest-level.types';

@Injectable()
export class PkgInterestEffects {
  constructor(
    private actions$: Actions,
    private pkgService: PkgService,
    private store: Store,
    private messageService: MessageService
  ) {}

  // ===========================
  // Load Interest Graph
  // ===========================
  
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

  // ===========================
  // Save Score Edit
  // ===========================
  
  saveScoreEdit$ = createEffect(() =>
    this.actions$.pipe(
      ofType(PkgInterestActions.saveScoreEdit),
      switchMap(({ userId, conceptId, conceptIds, conceptName, score }) => {
        // If multiple concept IDs (duplicates), use batch update endpoint
        if (conceptIds.length > 1) {
          return this.pkgService.updateInterestScoreForMultipleConcepts(userId, conceptIds, score, conceptName).pipe(
            map(() => {
              console.log('[PKG Interest Effects] Successfully updated score for multiple concepts:', conceptIds);
              return PkgInterestActions.saveScoreEditSuccess({ conceptId, conceptIds, score });
            }),
            catchError((error) => {
              const errorMessage = error?.error?.error || error?.message || 'Failed to update interest score';
              console.error('[PKG Interest Effects] Error updating score:', errorMessage);
              return of(PkgInterestActions.saveScoreEditFailure({ error: errorMessage }));
            })
          );
        } else {
          // Single concept ID
          return this.pkgService.updateInterestScore(userId, conceptId, score).pipe(
            map(() => {
              console.log('[PKG Interest Effects] Successfully updated score for concept:', conceptId);
              return PkgInterestActions.saveScoreEditSuccess({ conceptId, conceptIds: [conceptId], score });
            }),
            catchError((error) => {
              const errorMessage = error?.error?.error || error?.message || 'Failed to update interest score';
              console.error('[PKG Interest Effects] Error updating score:', errorMessage);
              return of(PkgInterestActions.saveScoreEditFailure({ error: errorMessage }));
            })
          );
        }
      })
    )
  );

  // ===========================
  // Show Success Message on Score Update
  // ===========================
  
  showScoreUpdateSuccess$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PkgInterestActions.saveScoreEditSuccess),
        tap(({ conceptIds, score }) => {
          const message = conceptIds.length > 1
            ? `Successfully updated interest score for ${conceptIds.length} concepts to ${score.toFixed(3)}`
            : `Successfully updated interest score to ${score.toFixed(3)}`;
          
          this.messageService.add({
            severity: 'success',
            summary: 'Score Updated',
            detail: message,
            life: 3000,
          });
        })
      ),
    { dispatch: false }
  );

  // ===========================
  // Show Error Message on Score Update Failure
  // ===========================
  
  showScoreUpdateError$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(PkgInterestActions.saveScoreEditFailure),
        tap(({ error }) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: error,
            life: 5000,
          });
        })
      ),
    { dispatch: false }
  );

  // ===========================
  // Reload when Top N changes (Optional)
  // ===========================
  
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

