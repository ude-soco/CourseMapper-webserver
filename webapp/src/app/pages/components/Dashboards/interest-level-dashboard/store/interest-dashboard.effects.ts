import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, switchMap, catchError, tap, withLatestFrom } from 'rxjs/operators';
import { MessageService } from 'primeng/api';
import * as InterestDashboardActions from './interest-dashboard.actions';
import * as InterestDashboardSelectors from './interest-dashboard.selectors';
import { InterestLevelService } from 'src/app/services/interest-level.service';
import { ConceptInterestData, TopConcept } from './interest-dashboard.state';

@Injectable()
export class InterestDashboardEffects {
  constructor(
    private actions$: Actions,
    private interestLevelService: InterestLevelService,
    private store: Store,
    private messageService: MessageService
  ) {}

  // ===========================
  // Load Concept Data
  // ===========================
  
  loadConceptData$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InterestDashboardActions.loadConceptData),
      switchMap(({ userId, conceptName }) =>
        this.interestLevelService.getUserConceptInterest(userId, conceptName).pipe(
          map((data: ConceptInterestData) => {
            console.log('[Interest Dashboard Effects] Loaded concept data:', conceptName);
            return InterestDashboardActions.loadConceptDataSuccess({ data });
          }),
          catchError((error) => {
            const errorMessage = error?.error?.error || error?.message || 'Failed to load concept data';
            console.error('[Interest Dashboard Effects] Error loading concept data:', errorMessage);
            return of(InterestDashboardActions.loadConceptDataFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  // ===========================
  // Load Top Concepts
  // ===========================
  
  loadTopConcepts$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InterestDashboardActions.loadTopConcepts),
      switchMap(({ userId, limit }) =>
        this.interestLevelService.getTopConceptsByInterest(userId, limit).pipe(
          map((concepts: TopConcept[]) => {
            console.log('[Interest Dashboard Effects] Loaded top concepts:', concepts.length);
            return InterestDashboardActions.loadTopConceptsSuccess({ concepts });
          }),
          catchError((error) => {
            const errorMessage = error?.error?.error || error?.message || 'Failed to load top concepts';
            console.error('[Interest Dashboard Effects] Error loading top concepts:', errorMessage);
            return of(InterestDashboardActions.loadTopConceptsFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  // ===========================
  // Initialize Dashboard (Load Both)
  // ===========================
  
  initializeDashboard$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InterestDashboardActions.initializeDashboard),
      switchMap(({ userId, conceptName }) => [
        InterestDashboardActions.loadConceptData({ userId, conceptName }),
        InterestDashboardActions.loadTopConcepts({ 
          userId, 
          limit: 5 // Default limit
        })
      ])
    )
  );

  // ===========================
  // Reload Top Concepts on Limit Change
  // ===========================
  
  reloadTopConceptsOnLimitChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(InterestDashboardActions.setTopConceptsLimit),
      // Only reload if we already have a conceptName (initialized)
      withLatestFrom(this.store.select(InterestDashboardSelectors.selectConceptName)),
      switchMap(([{ limit }, conceptName]) => {
        if (!conceptName) {
          return of({ type: '[Interest Dashboard] No-op' });
        }
        
        // Note: We'd need userId here. For now, the component will handle the reload
        // Or we can store userId in state as well
        return of({ type: '[Interest Dashboard] No-op' });
      })
    )
  );

  // ===========================
  // Show Error Messages
  // ===========================
  
  showErrorMessage$ = createEffect(
    () =>
      this.actions$.pipe(
        ofType(
          InterestDashboardActions.loadConceptDataFailure,
          InterestDashboardActions.loadTopConceptsFailure
        ),
        tap(({ error }) => {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: error,
            life: 5000
          });
        })
      ),
    { dispatch: false }
  );
}
