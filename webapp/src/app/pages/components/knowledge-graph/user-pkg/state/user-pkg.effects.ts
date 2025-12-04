import { Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { of } from 'rxjs';
import { map, switchMap, catchError, withLatestFrom, filter, take } from 'rxjs/operators';
import * as UserPkgActions from './user-pkg.actions';
import { Neo4jService } from 'src/app/services/neo4j.service';
import { UserPkgGraphData, CytoscapeNode, CytoscapeEdge, ConceptRecord } from '../types/user-pkg.types';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { getInitials } from 'src/app/_helpers/format';

@Injectable()
export class UserPkgEffects {
  constructor(
    private actions$: Actions,
    private neo4jService: Neo4jService,
    private store: Store
  ) {}

  // Reload data when TopN changes
  reloadOnTopNChange$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserPkgActions.setTopNConcepts),
      withLatestFrom(this.store.select(getLoggedInUser)),
      filter(([_, user]) => user !== null),
      map(([{ topNConcepts }, user]) => 
        UserPkgActions.loadUserPkg({ userId: user!.id, topNConcepts })
      )
    )
  );

  loadUserPkg$ = createEffect(() =>
    this.actions$.pipe(
      ofType(UserPkgActions.loadUserPkg),
      switchMap(({ userId, topNConcepts }) =>
        this.neo4jService.getUserPkg(userId, topNConcepts).pipe(
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
          type: concept.type,
          cid: concept.cid,
          wikipedia: concept.wikipedia,
          abstract: concept.abstract,
          weight: concept.weight,
          relationshipType: concept.relationshipType,
          slides: concept.slides,
          relatedConcepts: concept.relatedConcepts,
          courseId: concept.courseId,
          courseName: concept.courseName,
          courseShortName: concept.courseShortName,
          allCourseIds: concept.allCourseIds,
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
}
