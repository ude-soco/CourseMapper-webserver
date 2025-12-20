import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil, distinctUntilChanged, filter, take } from 'rxjs/operators';
import cytoscape from 'cytoscape';
import * as PkgInterestActions from '../../store/pkg-interest/pkg-interest.actions';
import * as PkgInterestSelectors from '../../store/pkg-interest/pkg-interest.selectors';
import { InterestConcept, InterestGraphData, InterestGraphNode, InterestGraphEdge } from '../../types/interest-level.types';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { getInitials } from 'src/app/_helpers/format';
import { User } from 'src/app/models/User';
import { PkgService } from 'src/app/services/pkg.service';
import { MessageService } from 'primeng/api';

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
  private tooltipTimeout: any = null;
  
  @Output() conceptSelected = new EventEmitter<any>();
  @Output() visibleNodesChanged = new EventEmitter<any[]>();
  @ViewChild('edgeTooltip', { static: false }) tooltipElement!: ElementRef;
  
  // Tooltip state
  tooltipVisible = false;
  tooltipText = '';
  tooltipX = 0;
  tooltipY = 0;
  
  // Score adjustment state
  adjustedScore = 0;
  originalScore = 0;
  currentConceptId = '';
  currentConceptName = '';
  currentConceptIds: string[] = []; // All concept IDs with the same name
  canEditScore = false;
  hasScoreChanged = false;
  isTooltipHovered = false;
  conceptNameToIdsMap: Map<string, string[]> = new Map(); // Map concept names to all their IDs

  constructor(
    private store: Store,
    private pkgService: PkgService,
    private messageService: MessageService
  ) {}

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

    // Add click event for nodes
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
    
    // Add hover tooltip for edges
    this.cy.on('mouseover', 'edge', (event: any) => {
      const edge = event.target;
      const edgeData = edge.data();
      
      if (edgeData.tooltip) {
        // Highlight edge
        edge.style({
          'line-color': '#6366F1',
          'target-arrow-color': '#6366F1',
          'width': 4
        });
        
        // Show tooltip at mouse position
        const container = this.cy.container();
        const containerRect = container.getBoundingClientRect();
        
        // Get edge midpoint position
        const midpoint = edge.midpoint();
        const renderedPosition = this.cy.zoom() * midpoint.x + this.cy.pan().x;
        const renderedPositionY = this.cy.zoom() * midpoint.y + this.cy.pan().y;
        
        // Extract concept info from edge
        const targetNode = this.cy.getElementById(edgeData.target);
        const conceptData = targetNode.data();
        
        this.currentConceptId = conceptData.conceptId;
        this.currentConceptName = conceptData.conceptName;
        // Get all concept IDs with the same name
        this.currentConceptIds = this.conceptNameToIdsMap.get(conceptData.conceptName) || [conceptData.conceptId];
        this.originalScore = edgeData.interestScore ?? 0;
        this.adjustedScore = this.originalScore;
        this.canEditScore = edgeData.interestScore !== null;
        this.hasScoreChanged = false;
        
        this.tooltipText = edgeData.tooltip;
        this.tooltipX = Math.min(renderedPosition + 10, window.innerWidth - 400);
        this.tooltipY = Math.max(renderedPositionY - 20, 10);
        this.tooltipVisible = true;
      }
    });
    
    this.cy.on('mouseout', 'edge', (event: any) => {
      const edge = event.target;
      
      // Reset edge style
      edge.style({
        'line-color': '#9CA3AF',
        'target-arrow-color': '#9CA3AF',
        'width': 3
      });
      
      // Delay hiding tooltip to allow hovering over it
      if (this.tooltipTimeout) {
        clearTimeout(this.tooltipTimeout);
      }
      
      this.tooltipTimeout = setTimeout(() => {
        if (!this.isTooltipHovered) {
          this.hideTooltip();
        }
      }, 200);
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
    this.conceptNameToIdsMap = new Map(); // Reset the map

    console.log('[Interest Level Graph] Total concepts before dedup:', concepts.length);
    console.log('[Interest Level Graph] Concepts:', concepts.map(c => ({ id: c.conceptId, name: c.conceptName })));

    // Build map of concept names to all their IDs from backend data
    concepts.forEach((concept) => {
      // Use allConceptIds from backend if available, otherwise fallback to single conceptId
      const allIds = concept.allConceptIds || [concept.conceptId];
      this.conceptNameToIdsMap.set(concept.conceptName, allIds);
    });

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
      
      const scoreDescription = concept.interestScore !== null
        ? `Interest Score: ${concept.interestScore.toFixed(5)}\n\nThis score (0-1) represents your level of interest in "${concept.conceptName}" based on your learning activities. Higher scores indicate stronger interest through interactions like viewing materials, marking concepts as understood, and engaging with related content.`
        : `Interest Score: Not yet calculated\n\nThis concept is part of your enrolled courses, but no activity-based interest score has been calculated yet. Your score will be updated during the next nightly batch processing.`;

      edges.push({
        data: {
          id: `edge_${user.id}_${concept.conceptId}`,
          source: `user_${user.id}`,
          target: nodeId,
          label: scoreLabel,
          interestScore: concept.interestScore,
          relationshipType: 'interested_in',
          tooltip: scoreDescription
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
          'width': (elm: any) => {
            const score = elm.data().interestScore;
            // Base size of 45px, scale up to 85px based on score (0-1 range)
            if (score === null || score === undefined) {
              return 45; // Default size for concepts without scores
            }
            const baseSize = 45;
            const maxAdditionalSize = 40;
            return baseSize + (score * maxAdditionalSize);
          },
          'height': (elm: any) => {
            const score = elm.data().interestScore;
            // Base size of 45px, scale up to 85px based on score (0-1 range)
            if (score === null || score === undefined) {
              return 45; // Default size for concepts without scores
            }
            const baseSize = 45;
            const maxAdditionalSize = 40;
            return baseSize + (score * maxAdditionalSize);
          },
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
  
  // Tooltip interaction methods
  onTooltipMouseEnter(): void {
    this.isTooltipHovered = true;
    if (this.tooltipTimeout) {
      clearTimeout(this.tooltipTimeout);
      this.tooltipTimeout = null;
    }
  }
  
  onTooltipMouseLeave(): void {
    this.isTooltipHovered = false;
    this.tooltipTimeout = setTimeout(() => {
      this.hideTooltip();
    }, 300);
  }
  
  hideTooltip(): void {
    this.tooltipVisible = false;
    this.tooltipText = '';
    this.hasScoreChanged = false;
  }
  
  // Score adjustment methods
  onScoreChange(event: any): void {
    this.adjustedScore = parseFloat(event.target.value);
    this.hasScoreChanged = Math.abs(this.adjustedScore - this.originalScore) > 0.001;
  }
  
  resetScore(): void {
    this.adjustedScore = this.originalScore;
    this.hasScoreChanged = false;
  }
  
  saveAdjustedScore(): void {
    if (!this.currentUser || !this.currentConceptIds.length) {
      return;
    }
    
    console.log(`[Interest Level] Saving adjusted score: ${this.adjustedScore} for concept: ${this.currentConceptName}`);
    console.log(`[Interest Level] Updating ${this.currentConceptIds.length} concept IDs:`, this.currentConceptIds);
    
    this.pkgService.updateInterestScoreForMultipleConcepts(
      this.currentUser.id,
      this.currentConceptIds,
      this.adjustedScore
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[Interest Level] Score updated successfully:', response);
          
          this.messageService.add({
            severity: 'success',
            summary: 'Score Updated',
            detail: `Interest score for "${this.currentConceptName}" updated to ${this.adjustedScore.toFixed(3)} (${this.currentConceptIds.length} concept instances)`
          });
          
          // Update the edge label in the current graph without reloading
          this.updateEdgeScore(this.currentConceptId, this.adjustedScore);
          
          // Update all concepts with this name in the store
          this.currentConceptIds.forEach(conceptId => {
            this.updateConceptInStore(conceptId, this.adjustedScore);
          });
          
          // Reset state
          this.originalScore = this.adjustedScore;
          this.hasScoreChanged = false;
        },
        error: (error) => {
          console.error('[Interest Level] Error updating score:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Update Failed',
            detail: error.error?.message || 'Failed to update interest score'
          });
        }
      });
  }
  
  private updateEdgeScore(conceptId: string, newScore: number): void {
    if (!this.cy || !this.currentUser) return;
    
    const edgeId = `edge_${this.currentUser.id}_${conceptId}`;
    const edge = this.cy.getElementById(edgeId);
    
    if (edge) {
      const scoreLabel = `Interested_in : score (${newScore.toFixed(5).replace('.', ',')})`;
      edge.data('label', scoreLabel);
      edge.data('interestScore', newScore);
      
      // Also update the target concept node's interestScore
      const targetNode = this.cy.getElementById(edge.data('target'));
      if (targetNode) {
        targetNode.data('interestScore', newScore);
      }
    }
  }
  
  private updateConceptInStore(conceptId: string, newScore: number): void {
    // Get current concepts from store
    this.store.select(PkgInterestSelectors.selectInterestConcepts)
      .pipe(take(1))
      .subscribe(concepts => {
        // Update the specific concept's score
        const updatedConcepts = concepts.map(concept => 
          concept.conceptId === conceptId 
            ? { ...concept, interestScore: newScore }
            : concept
        );
        
        // Dispatch action to update the store
        this.store.dispatch(PkgInterestActions.loadInterestGraphSuccess({ 
          concepts: updatedConcepts 
        }));
      });
  }
}

