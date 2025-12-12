import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, switchMap, catchError, withLatestFrom, filter, take, tap } from 'rxjs/operators';
import * as UserPkgActions from './user-pkg.actions';
import * as UserPkgSelectors from './user-pkg.reducer';
import { Neo4jService } from 'src/app/services/neo4j.service';
import { FilterProfilesService } from 'src/app/services/pkg-filter-profiles.service';
import { UserPkgGraphData, CytoscapeNode, CytoscapeEdge, ConceptRecord } from '../types/user-pkg.types';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { getInitials } from 'src/app/_helpers/format';

@Injectable()
export class UserPkgEffects {
  constructor(
    private actions$: Actions,
    private neo4jService: Neo4jService,
    private filterProfilesService: FilterProfilesService,
    private store: Store
  ) {}

  // Reload data when TopN changes
  reloadOnTopNChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserPkgActions.setTopNConcepts),
      withLatestFrom(
        this.store.select(getLoggedInUser),
        this.store.select(UserPkgSelectors.selectAdvancedFilters)
      ),
      filter(([_, user]) => user !== null),
      map(([{ topNConcepts }, user, advancedFilters]) => 
        UserPkgActions.loadUserPkg({ 
          userId: user!.id, 
          topNConcepts,
          slideIds: advancedFilters?.selectedSlideIds
        })
      )
    )
  );

  // Reload data when Advanced Filters change
  reloadOnAdvancedFiltersChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserPkgActions.setAdvancedFilters),
      withLatestFrom(
        this.store.select(getLoggedInUser),
        this.store.select(UserPkgSelectors.selectTopNConcepts)
      ),
      filter(([_, user]) => user !== null),
      map(([{ selectedSlideIds }, user, topNConcepts]) => 
        UserPkgActions.loadUserPkg({ 
          userId: user!.id, 
          topNConcepts,
          slideIds: selectedSlideIds
        })
      )
    )
  );

  loadUserPkg$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserPkgActions.loadUserPkg),
      switchMap(({ userId, topNConcepts, slideIds }) =>
        this.neo4jService.getUserPkg(userId, topNConcepts, slideIds).pipe(
          map((response) => {
            console.log('[Effects] Received response:', response);
            
            // Debug: log relationship types
            const relationshipTypes = response.records.map(r => r.relationshipType);
            const typeCounts = relationshipTypes.reduce((acc: any, t) => {
              acc[t] = (acc[t] || 0) + 1;
              return acc;
            }, {});
            console.log('[Effects] Relationship type counts:', typeCounts);
            
            const graphData = this.transformToGraphData(userId, response.records);
            return UserPkgActions.loadUserPkgSuccess({
              graphData,
              rawConceptRecords: response.records,
              courses: response.courses,
              materials: response.materials,
            });
          }),
          catchError((error) => {
            const errorMessage = error?.error?.error || error?.message || 'Failed to load knowledge graph';
            return of(UserPkgActions.loadUserPkgFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  // Load course hierarchy (cached in store)
  loadCourseHierarchy$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserPkgActions.loadCourseHierarchy),
      withLatestFrom(this.store.select(UserPkgSelectors.selectCourseHierarchy)),
      switchMap(([_, cachedHierarchy]) => {
        // If already loaded, don't fetch again
        if (cachedHierarchy) {
          console.log('[Effects] Using cached course hierarchy');
          return of(UserPkgActions.loadCourseHierarchySuccess({ courses: cachedHierarchy }));
        }
        
        // Fetch from backend
        return this.neo4jService.getCourseHierarchy().pipe(
          map((response) => {
            console.log('[Effects] Loaded course hierarchy:', response.courses.length, 'courses');
            return UserPkgActions.loadCourseHierarchySuccess({ courses: response.courses });
          }),
          catchError((error) => {
            const errorMessage = error?.error?.error || error?.message || 'Failed to load course hierarchy';
            console.error('[Effects] Error loading course hierarchy:', errorMessage);
            return of(UserPkgActions.loadCourseHierarchyFailure({ error: errorMessage }));
          })
        );
      })
    )
  );

  /**
   * Transform API records to Cytoscape graph data
   * Backend returns aggregated data with slides[] and relatedConcepts[] arrays
   */
  private transformToGraphData(userId: string, records: ConceptRecord[]): UserPkgGraphData {
    const nodes: CytoscapeNode[] = [];
    const edges: CytoscapeEdge[] = [];

    // Add user node at center
    const userNodeId = `user-${userId}`;
    
    // Get user's initials using the same function as the navbar
    let initials = 'U';
    
    this.store.select(getLoggedInUser).pipe(
      take(1),
      filter(user => user !== null)
    ).subscribe(user => {
      initials = getInitials(user?.name || '');
    });
    
    nodes.push({
      data: {
        id: userNodeId,
        name: 'You',
        type: 'user',
        uid: userId,
        initials: initials // This will be displayed in the node
      },
    });

    // Merge concepts by Wikipedia URL (same concept can appear in multiple materials)
    const conceptMap = new Map<string, any>();
    
    records.forEach((record) => {
      // Use wikipedia URL as key, fallback to name
      const conceptKey = record.wikipedia 
        ? record.wikipedia.toLowerCase().trim()
        : `name:${record.name.toLowerCase().trim()}`;
      
      if (conceptMap.has(conceptKey)) {
        const existing = conceptMap.get(conceptKey);
        // Keep highest weight
        if (record.weight > existing.weight) {
          existing.weight = record.weight;
        }
        // Collect all course IDs
        if (record.courseId && !existing.allCourseIds.includes(record.courseId)) {
          existing.allCourseIds.push(record.courseId);
        }
      } else {
        conceptMap.set(conceptKey, {
          ...record,
          allCourseIds: record.courseId ? [record.courseId] : [],
        });
      }
    });

    // Filter to only main concepts for the initial graph
    const mainConcepts = Array.from(conceptMap.values())
      .filter(c => c.type === 'main_concept' || !c.type)
      .sort((a, b) => b.weight - a.weight);

    console.log(`[Effects] Merged ${records.length} records into ${mainConcepts.length} main concepts`);
    console.log('[Effects] Sample concept data:', mainConcepts[0]);

    // Add concept nodes and edges
    mainConcepts.forEach((concept, index) => {
      const conceptNodeId = `concept-${concept.cid}`;

      nodes.push({
        data: {
          id: conceptNodeId,
          name: concept.name,
          type: concept.type || 'main_concept',
          cid: concept.cid,
          wikipedia: concept.wikipedia,
          abstract: concept.abstract,
          weight: concept.weight,
          relationshipType: concept.relationshipType,
          slides: concept.slides,
          courseId: concept.courseId,
          courseName: concept.courseName,
          courseShortName: concept.courseShortName,
          allCourseIds: concept.allCourseIds,
          // Placeholder for interest score (to be fetched separately)
          interestScore: concept.interestScore,
        },
      });

      edges.push({
        data: {
          id: `edge-${index}`,
          source: userNodeId,
          target: conceptNodeId,
          type: concept.relationshipType,
          label: '',
        },
      });
    });

    return { nodes, edges };
  }

  // Load filter profiles
  loadFilterProfiles$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserPkgActions.loadFilterProfiles),
      withLatestFrom(this.store.select(getLoggedInUser)),
      filter(([_, user]) => user !== null),
      switchMap(([_, user]) =>
        this.filterProfilesService.getFilterProfiles(user!.id).pipe(
          map(response => {
            console.log('[Effects] Loaded filter profiles:', response.profiles.length);
            return UserPkgActions.loadFilterProfilesSuccess({ profiles: response.profiles });
          }),
          catchError(error => {
            const errorMessage = error?.error?.error || error?.message || 'Failed to load filter profiles';
            console.error('[Effects] Error loading filter profiles:', errorMessage);
            return of(UserPkgActions.loadFilterProfilesFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  // Create filter profile
  createFilterProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserPkgActions.createFilterProfile),
      withLatestFrom(this.store.select(getLoggedInUser)),
      filter(([_, user]) => user !== null),
      switchMap(([{ name, slideIds }, user]) =>
        this.filterProfilesService.createFilterProfile(user!.id, name, slideIds).pipe(
          map(response => {
            console.log('[Effects] Created filter profile:', response.profile.name);
            return UserPkgActions.createFilterProfileSuccess({ profile: response.profile });
          }),
          catchError(error => {
            const errorMessage = error?.error?.error || error?.message || 'Failed to create filter profile';
            console.error('[Effects] Error creating filter profile:', errorMessage);
            return of(UserPkgActions.createFilterProfileFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  // Update filter profile
  updateFilterProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserPkgActions.updateFilterProfile),
      withLatestFrom(this.store.select(getLoggedInUser)),
      filter(([_, user]) => user !== null),
      switchMap(([{ profileId, name, slideIds }, user]) =>
        this.filterProfilesService.updateFilterProfile(user!.id, profileId, name, slideIds).pipe(
          map(response => {
            console.log('[Effects] Updated filter profile:', response.profile.name);
            return UserPkgActions.updateFilterProfileSuccess({ profile: response.profile });
          }),
          catchError(error => {
            const errorMessage = error?.error?.error || error?.message || 'Failed to update filter profile';
            console.error('[Effects] Error updating filter profile:', errorMessage);
            return of(UserPkgActions.updateFilterProfileFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  // Delete filter profile
  deleteFilterProfile$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserPkgActions.deleteFilterProfile),
      withLatestFrom(this.store.select(getLoggedInUser)),
      filter(([_, user]) => user !== null),
      switchMap(([{ profileId }, user]) =>
        this.filterProfilesService.deleteFilterProfile(user!.id, profileId).pipe(
          map(() => {
            console.log('[Effects] Deleted filter profile:', profileId);
            return UserPkgActions.deleteFilterProfileSuccess({ profileId });
          }),
          catchError(error => {
            const errorMessage = error?.error?.error || error?.message || 'Failed to delete filter profile';
            console.error('[Effects] Error deleting filter profile:', errorMessage);
            return of(UserPkgActions.deleteFilterProfileFailure({ error: errorMessage }));
          })
        )
      )
    )
  );

  // Load interest scores when view mode changes to 'interest'
  loadInterestScoresOnViewModeChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserPkgActions.setViewMode),
      filter(({ viewMode }) => viewMode === 'interest'),
      withLatestFrom(
        this.store.select(getLoggedInUser),
        this.store.select(UserPkgSelectors.selectInterestScores)
      ),
      filter(([_, user, scores]) => user !== null && scores === null), // Only load if not already loaded
      map(([_, user]) => 
        UserPkgActions.loadUserInterestScores({ userId: user!.id })
      )
    )
  );

  // Load interest scores
  loadUserInterestScores$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserPkgActions.loadUserInterestScores),
      switchMap(({ userId, minScore }) =>
        this.neo4jService.getUserInterestScores(userId, minScore).pipe(
          map((response) => {
            console.log('[Effects] Loaded interest scores:', response.totalConcepts, 'concepts');
            return UserPkgActions.loadUserInterestScoresSuccess({ scores: response.scores });
          }),
          catchError((error) => {
            const errorMessage = error?.error?.error || error?.message || 'Failed to load interest scores';
            console.error('[Effects] Error loading interest scores:', errorMessage);
            return of(UserPkgActions.loadUserInterestScoresFailure({ error: errorMessage }));
          })
        )
      )
    )
  );
}
