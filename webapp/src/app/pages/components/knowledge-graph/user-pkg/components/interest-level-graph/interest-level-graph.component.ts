import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, filter } from 'rxjs/operators';
import cytoscape from 'cytoscape';
import * as PkgInterestActions from '../../store/pkg-interest/pkg-interest.actions';
import * as PkgInterestSelectors from '../../store/pkg-interest/pkg-interest.selectors';
import { InterestConcept, InterestGraphData, InterestGraphNode, InterestGraphEdge } from '../../types/interest-level.types';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { getInitials } from 'src/app/_helpers/format';
import { User } from 'src/app/models/User';

@Component({
  selector: 'app-interest-level-graph',
  templateUrl: './interest-level-graph.component.html',
  styleUrls: ['./interest-level-graph.component.css']
})
export class InterestLevelGraphComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private cy: any = null;
  private currentSearchTerm = '';
  private currentUser: User | null = null;
  
  @Output() conceptSelected = new EventEmitter<any>();
  @Output() visibleNodesChanged = new EventEmitter<any[]>();

  constructor(private store: Store) {}

  ngOnInit(): void {
    console.log('[Interest Level Graph] Component initialized');
    this.subscribeToStore();
    this.loadUserAndInitialize();
  }

  ngOnDestroy(): void {
    if (this.cy) {
      this.cy.destroy();
    }
    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadUserAndInitialize(): void {
    this.store.select(getLoggedInUser)
      .pipe(
        takeUntil(this.destroy$),
        filter((user): user is User => user !== null)
      )
      .subscribe(user => {
        this.currentUser = user;
        // Get current topN and load interest graph
        this.store.select(PkgInterestSelectors.selectTopN)
          .pipe(takeUntil(this.destroy$))
          .subscribe(topN => {
            this.store.dispatch(PkgInterestActions.loadInterestGraph({ 
              userId: user.id, 
              topN 
            }));
          });
      });
  }

  private subscribeToStore(): void {
    // Subscribe to filtered concepts
    this.store.select(PkgInterestSelectors.selectFilteredInterestConcepts)
      .pipe(takeUntil(this.destroy$))
      .subscribe(concepts => {
        if (concepts && concepts.length > 0) {
          console.log('[Interest Level Graph] Rendering graph with concepts:', concepts.length);
          this.renderGraph(concepts);
        }
      });

    // Subscribe to search term for highlighting
    this.store.select(PkgInterestSelectors.selectSearchTerm)
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(term => {
        this.currentSearchTerm = term;
        if (this.cy) {
          this.applySearchHighlight();
        }
      });
  }

  private renderGraph(concepts: InterestConcept[]): void {
    if (!this.currentUser) return;

    const graphData = this.transformToGraphData(this.currentUser, concepts);
    
    if (this.cy) {
      this.cy.destroy();
    }

    const container = document.getElementById('cy-interest');
    if (!container) {
      console.error('[Interest Level Graph] Container not found');
      return;
    }

    this.cy = cytoscape({
      container: container,
      elements: [...graphData.nodes, ...graphData.edges],
      style: this.getCytoscapeStyle(),
      layout: {
        name: 'cose',
        idealEdgeLength: 100,
        nodeOverlap: 20,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
      },
      wheelSensitivity: 0.2,
    });

    // Add click event
    this.cy.on('tap', 'node', (event: any) => {
      const node = event.target;
      const nodeData = node.data();
      
      if (nodeData.type === 'concept') {
        console.log('[Interest Level Graph] Concept node clicked:', nodeData);
        // Emit concept data in the same format as cytoscape-pkg
        this.conceptSelected.emit({
          id: nodeData.id,
          name: nodeData.conceptName,
          cid: nodeData.conceptId,
          type: 'main_concept',
          wikipedia: nodeData.wikipedia,
          abstract: nodeData.abstract,
          interestScore: nodeData.interestScore
        });
      } else if (nodeData.type === 'user') {
        console.log('[Interest Level Graph] User node clicked');
      }
    });

    // Emit visible nodes after render
    setTimeout(() => {
      this.emitVisibleNodes();
    }, 100);

    this.applySearchHighlight();
  }

  private transformToGraphData(user: User, concepts: InterestConcept[]): InterestGraphData {
    const nodes: InterestGraphNode[] = [];
    const edges: InterestGraphEdge[] = [];
    const seenConceptIds = new Set<string>();

    console.log('[Interest Level Graph] Total concepts before dedup:', concepts.length);
    console.log('[Interest Level Graph] Concepts:', concepts.map(c => ({ id: c.conceptId, name: c.conceptName })));

    // Create user node with user initials
    nodes.push({
      data: {
        id: `user_${user.id}`,
        label: getInitials(user.name || ''),
        type: 'user'
      }
    });

    // Create concept nodes and edges with deduplication
    concepts.forEach((concept) => {
      const nodeId = `concept_${concept.conceptId}`;
      
      // Skip if we've already added this concept
      if (seenConceptIds.has(concept.conceptId)) {
        console.warn('[Interest Level Graph] Skipping duplicate concept:', concept.conceptId, concept.conceptName);
        return;
      }
      
      seenConceptIds.add(concept.conceptId);
      
      // Create concept node (blue)
      nodes.push({
        data: {
          id: nodeId,
          label: concept.conceptName,
          type: 'concept',
          conceptId: concept.conceptId,
          conceptName: concept.conceptName,
          wikipedia: concept.wikipedia,
          abstract: concept.abstract,
          interestScore: concept.interestScore
        }
      });

      // Create edge from user to concept
      const scoreLabel = concept.interestScore !== null 
        ? `Interested_in : score (${concept.interestScore.toFixed(5).replace('.', ',')})`
        : 'Interested_in : score (null)';

      edges.push({
        data: {
          id: `edge_${user.id}_${concept.conceptId}`,
          source: `user_${user.id}`,
          target: nodeId,
          label: scoreLabel,
          interestScore: concept.interestScore,
          relationshipType: 'interested_in'
        }
      });
    });

    return { nodes, edges };
  }

  private getCytoscapeStyle(): any[] {
    return [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 5,
          'font-size': '14px',
          'font-weight': 'bold',
          'text-wrap': 'wrap',
          'text-max-width': '100px',
          'text-outline-width': 2,
          'text-outline-color': '#fff',
          'color': '#000',
        }
      },
      {
        selector: 'node[type="user"]',
        style: {
          'background-color': '#9B59B6',
          'border-color': '#7D3C98',
          'width': '70px',
          'height': '70px',
          'shape': 'ellipse',
          'border-width': '3px',
          'content': 'data(label)',
          'text-valign': 'center',
          'text-halign': 'center',
          'color': 'white',
          'font-size': '26px',
          'font-weight': '400',
          'text-margin-y': '0',
          'text-outline-width': 0,
          'text-outline-color': 'transparent'
        }
      },
      {
        selector: 'node[type="concept"]',
        style: {
          'background-color': '#3B82F6',
          'border-color': '#1E40AF',
          'width': '60px',
          'height': '60px',
          'border-width': '3px',
        }
      },
      {
        selector: 'node.highlighted',
        style: {
          'border-width': '4px',
          'border-color': '#F59E0B',
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 3,
          'line-color': '#9CA3AF',
          'target-arrow-color': '#9CA3AF',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'font-size': '11px',
          'font-weight': 'bold',
          'text-rotation': 'autorotate',
          'color': '#374151',
          'text-outline-color': '#fff',
          'text-outline-width': 2,
        }
      }
    ];
  }

  private applySearchHighlight(): void {
    if (!this.cy) return;

    // Remove all highlighting
    this.cy.nodes().removeClass('highlighted');

    if (!this.currentSearchTerm || !this.currentSearchTerm.trim()) {
      return;
    }

    const query = this.currentSearchTerm.toLowerCase().trim();
    
    // Highlight matching concept nodes
    this.cy.nodes('[type="concept"]').forEach((node: any) => {
      const conceptName = node.data('conceptName')?.toLowerCase() || '';
      if (conceptName.includes(query)) {
        node.addClass('highlighted');
      }
    });
  }

  private emitVisibleNodes(): void {
    if (!this.cy) return;
    
    const visibleNodes = this.cy.nodes().map((node: any) => node.data());
    this.visibleNodesChanged.emit(visibleNodes);
  }
}
