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

/**
 * Interest Dashboard Effects
 * 
 * THESIS CONTEXT:
 * This effects class handles all side effects for the Interest Level Dashboard,
 * managing API calls to fetch user interest scores and top concepts.
 * 
 * KEY RESPONSIBILITIES:
 * 1. Load concept interest data (scores, activities breakdown) for a specific user-concept pair
 * 2. Load top N concepts by interest score for a user
 * 3. Handle initialization of the dashboard by triggering both loads
 * 4. Display error notifications when API calls fail
 * 
 * INTEGRATION WITH THESIS:
 * - Fetches calculated interest scores from the backend Python service
 * - Retrieves activity breakdowns showing which activities contributed to the score
 * - Supports the visual explanation component by providing detailed data
 */
@Injectable()
export class InterestDashboardEffects {
  constructor(
    private actions$: Actions,
    private interestLevelService: InterestLevelService,
    private store: Store,
    private messageService: MessageService
  ) {}

  /**
   * EFFECT: Load Concept Data
   * 
   * PURPOSE:
   * Fetches interest score and activity breakdown for a specific user-concept pair.
   * This is the core data for the dashboard visualization.
   * 
   * FLOW:
   * 1. Listens for loadConceptData action
   * 2. Calls backend API: GET /interest-level/user/{userId}/concept/{conceptName}
   * 3. On success: Dispatches loadConceptDataSuccess with ConceptInterestData
   * 4. On failure: Dispatches loadConceptDataFailure with error message
   * 
   * DATA RETURNED (ConceptInterestData):
   * - concept_ids: Array of Neo4j concept IDs
   * - raw_score: Raw calculated score before normalization
   * - normalized_scores: Object with min_max_interpolation, z_score_k2, z_score_k3
   * - activities_breakdown: Array of activities with count, weight, contribution
   * - total_activity_count: Total number of activities performed
   * - course_id: ID of the course containing this concept
   * - course_name: Name of the course
   * 
   * THESIS RELEVANCE:
   * This retrieves the calculated interest score (using Min-Max normalization)
   * and the detailed activity breakdown for visual explanation.
   */
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

  /**
   * EFFECT: Load Top Concepts
   * 
   * PURPOSE:
   * Retrieves the top N concepts with highest interest scores for a user.
   * Used to show comparison of current concept against other high-interest concepts.
   * 
   * FLOW:
   * 1. Listens for loadTopConcepts action
   * 2. Calls backend API: GET /interest-level/user/{userId}/top-concepts?limit={limit}
   * 3. On success: Dispatches loadTopConceptsSuccess with array of TopConcept objects
   * 4. On failure: Dispatches loadTopConceptsFailure with error message
   * 
   * DATA RETURNED (TopConcept[]):
   * Each TopConcept contains:
   * - name: Concept name
   * - score: Normalized interest score (0-1)
   * - course: Course name where concept appears
   * 
   * USE CASE:
   * Powers the "Top Concepts" chart showing user's strongest interests
   * for comparison with the current concept being viewed.
   */
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

  /**
   * EFFECT: Initialize Dashboard
   * 
   * PURPOSE:
   * Single action to trigger loading both concept data and top concepts.
   * This ensures both datasets are loaded together when dashboard opens.
   * 
   * FLOW:
   * 1. Listens for initializeDashboard action
   * 2. Dispatches TWO actions simultaneously:
   *    a) loadConceptData - for the specific concept being viewed
   *    b) loadTopConcepts - for top 5 concepts (default limit)
   * 
   * WHY:
   * This pattern avoids the component needing to dispatch multiple actions.
   * It ensures consistent initialization every time the dashboard loads.
   * 
   * TRIGGERED BY:
   * Component ngOnInit() when user navigates to interest dashboard.
   */
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

  /**
   * EFFECT: Reload Top Concepts on Limit Change
   * 
   * PURPOSE:
   * When user changes the "Show Top N" dropdown, reload the top concepts
   * with the new limit.
   * 
   * CURRENT STATE:
   * This is a placeholder effect. The actual reload logic is handled in the component
   * because we need the userId which isn't stored in the Interest Dashboard state.
   * 
   * FUTURE IMPROVEMENT:
   * Consider storing userId in state to enable this effect to handle reloads directly.
   */
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

  /**
   * EFFECT: Show Error Messages
   * 
   * PURPOSE:
   * Display user-friendly error notifications when API calls fail.
   * Uses PrimeNG MessageService to show toast notifications.
   * 
   * TRIGGERED BY:
   * - loadConceptDataFailure: When concept data fetch fails
   * - loadTopConceptsFailure: When top concepts fetch fails
   * 
   * BEHAVIOR:
   * Shows error toast with:
   * - Severity: 'error' (red color)
   * - Summary: 'Error'
   * - Detail: The specific error message from backend
   * - Life: 5000ms (auto-dismiss after 5 seconds)
   * 
   * WHY NO DISPATCH:
   * { dispatch: false } because this effect only triggers side effects (UI notification)
   * and doesn't need to dispatch any new actions to the store.
   */
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
