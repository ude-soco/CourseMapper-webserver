import { Component, OnInit, OnDestroy, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
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
import { Neo4jService } from 'src/app/services/neo4j.service';

// Import cytoscape context menu
declare var require: any;
const cxtmenu = require('cytoscape-cxtmenu');
if (typeof cytoscape !== 'undefined') {
  cytoscape.use(cxtmenu);
}

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
  private lastEditedConceptId: string | null = null; // Track last edited concept for highlighting
  private isUpdatingScore = false; // Flag to prevent re-render during score update
  
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
  conceptsWithVisibleRelated: Set<string> = new Set(); // Track which concepts have related concepts shown

  constructor(
    private store: Store,
    private router: Router,
    private pkgService: PkgService,
    private messageService: MessageService,
    private neo4jService: Neo4jService
  ) {}

  ngOnInit(): void {
    console.log('[Interest Level Graph] Component initialized');
    this.listenToStoreChanges();
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

  private listenToStoreChanges(): void {
    // Subscribe to filtered concepts
    this.store.select(PkgInterestSelectors.selectFilteredInterestConcepts)
      .pipe(takeUntil(this.destroy$))
      .subscribe(concepts => {
        if (concepts && concepts.length > 0) {
          // Skip re-rendering if we're just updating a score in place
          if (this.isUpdatingScore) {
            console.log('[Interest Level Graph] Skipping re-render during score update');
            this.isUpdatingScore = false;
            return;
          }
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
    
    // Try to retrieve stored node positions
    const storedPositions = this.getSavedNodePositions();
    const hasStoredPositions = storedPositions && Object.keys(storedPositions).length > 0;
    
    // If positions exist, apply them to nodes before rendering
    if (hasStoredPositions) {
      graphData.nodes.forEach(node => {
        const nodeId = node.data.id;
        if (storedPositions[nodeId]) {
          node.position = storedPositions[nodeId];
        }
      });
    }
    
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
        name: hasStoredPositions ? 'preset' : 'cose',
        idealEdgeLength: 150,
        nodeOverlap: 40,
        refresh: 20,
        fit: !hasStoredPositions, // Don't fit if we're using stored positions
        padding: 50,
        randomize: false,
        componentSpacing: 150,
        nodeRepulsion: 800000,
        edgeElasticity: 200,
        nestingFactor: 1,
        gravity: 50,
        numIter: 2000,
        initialTemp: 300,
        coolingFactor: 0.99,
        minTemp: 1.0
      }as any,
      wheelSensitivity: 0.2,
    });

    // Add click event for nodes
    this.cy.on('tap', 'node', (event: any) => {
      const node = event.target;
      const nodeData = node.data();
      
      if (nodeData.type === 'concept' || nodeData.type === 'related_concept') {
        console.log('[Interest Level Graph] Concept node clicked:', nodeData);
        // Emit concept data in the same format as cytoscape-pkg
        this.conceptSelected.emit({
          id: nodeData.id,
          name: nodeData.conceptName || nodeData.label,
          cid: nodeData.conceptId,
          type: nodeData.type === 'related_concept' ? 'related_concept' : 'main_concept',
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
        
        // Generate explanation text with actual activity count from edge data
        const activityCount = edgeData.activityCount || 0;
        this.tooltipText = this.generateExplanationText(conceptData.conceptName, activityCount);
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

    // Initialize context menu
    this.initializeContextMenu();

    // Emit visible nodes after render
    setTimeout(() => {
      this.emitVisibleNodes();
    }, 100);

    this.applySearchHighlight();
    
    // If we have a last edited concept, highlight it
    if (this.lastEditedConceptId) {
      this.highlightEditedConcept(this.lastEditedConceptId);
      // Clear the edited concept marker after 5 seconds
      setTimeout(() => {
        this.lastEditedConceptId = null;
        this.clearSavedNodePositions();
      }, 5000);
    }
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
          tooltip: scoreDescription,
          activityCount: concept.activityCount || 0
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
        selector: 'node[type="related_concept"]',
        style: {
          'background-color': '#ce6f34',
          'border-color': '#a85a29',
          'width': '50px',
          'height': '50px',
          'border-width': '2px',
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
        selector: 'node.recently-edited',
        style: {
          'border-width': '5px',
          'border-color': '#10B981',
          'border-style': 'solid'
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
      },
      {
        selector: 'edge[label="related_to"]',
        style: {
          'width': 2,
          'line-color': '#9CA3AF',
          'target-arrow-color': '#9CA3AF',
          'line-style': 'solid',
          'label': 'data(label)',
          'text-transform': 'uppercase',
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
  
  navigateToInterestDashboard(): void {
    // Store current view mode before navigating
    sessionStorage.setItem('pkgReturnView', 'interest');
    
    this.router.navigate(['/user/interest-level'], {
      queryParams: {
        conceptName: this.currentConceptName,
        conceptId: this.currentConceptId
      }
    });
  }
  
  // Score adjustment methods
  onScoreChange(event: any): void {
    this.adjustedScore = parseFloat(event.target.value);
    this.hasScoreChanged = Math.abs(this.adjustedScore - this.originalScore) > 0.001;
  }

  onSliderChange(event: any): void {
    this.adjustedScore = event.value;
    this.hasScoreChanged = Math.abs(this.adjustedScore - this.originalScore) > 0.01;
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
      this.adjustedScore,
      this.currentConceptName // Pass concept name to update JSON file
    ).pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[Interest Level] Score updated successfully:', response);
          
          this.messageService.add({
            severity: 'success',
            summary: 'Score Updated',
            detail: `Interest score for "${this.currentConceptName}" updated to ${this.adjustedScore.toFixed(3)} (${this.currentConceptIds.length} concept instances)`
          });
          
          // Update the edge label and node in the current graph without reloading
          this.updateEdgeScore(this.currentConceptId, this.adjustedScore);
          
          // Update store silently (set flag BEFORE dispatching)
          this.isUpdatingScore = true;
          this.updateAllConceptsInStore(this.currentConceptIds, this.adjustedScore);
          
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
  
  private updateAllConceptsInStore(conceptIds: string[], newScore: number): void {
    // Get current concepts from store and update all matching concept IDs in a single dispatch
    this.store.select(PkgInterestSelectors.selectInterestConcepts)
      .pipe(take(1))
      .subscribe(concepts => {
        const conceptIdSet = new Set(conceptIds);
        
        // Update all concepts with matching IDs
        const updatedConcepts = concepts.map(concept => 
          conceptIdSet.has(concept.conceptId)
            ? { ...concept, interestScore: newScore }
            : concept
        );
        
        // Single dispatch to update store
        this.store.dispatch(PkgInterestActions.loadInterestGraphSuccess({ concepts: updatedConcepts }));
      });
  }

  // Context Menu and Related Concepts Methods
  
  private initializeContextMenu(): void {
    if (!this.cy) return;
    
    // Destroy existing menu if any
    try {
      (this.cy as any).cxtmenu('destroy');
    } catch (e) {
      // Ignore if no menu exists
    }

    // Context menu for concept nodes
    (this.cy as any).cxtmenu({
      menuRadius: 100,
      fillColor: 'rgba(0, 0, 0, 0.75)',
      activeFillColor: 'rgba(59, 130, 246, 0.85)',
      activePadding: 20,
      indicatorSize: 24,
      separatorWidth: 3,
      spotlightPadding: 4,
      itemColor: 'white',
      itemTextShadowColor: 'transparent',
      zIndex: 9999,
      atMouse: false,
      outsideMenuCancel: false,
      selector: 'node[type="concept"]',
      commands: (ele: any) => {
        const hasRelated = this.checkForRelatedConcepts(ele);
        const commands = [
          {
            content: '<span style="font-size:14px;">View Interest Dashboard</span> <br> <i class="pi pi-chart-line" style="color:#3B82F6;"></i>',
            select: () => this.handleViewInterestDashboard(ele),
          },
          {
            content: hasRelated 
              ? '<span style="font-size:14px;">Hide Related</span> <br> <i class="pi pi-link" style="color:#6B7280;"></i>'
              : '<span style="font-size:14px;">Show Related</span> <br> <i class="pi pi-link" style="color:#8B5CF6;"></i>',
            select: () => this.handleToggleRelated(ele),
          }
        ];
        return commands;
      },
    });
  }

  private checkForRelatedConcepts(node: any): boolean {
    const conceptId = node.id();
    return this.conceptsWithVisibleRelated.has(conceptId);
  }

  private handleViewInterestDashboard(node: any): void {
    const nodeData = node.data();
    const conceptName = nodeData.label || nodeData.name;
    const conceptId = nodeData.conceptId;
    
    // Get the interest score from the edge connecting user to this concept
    const userNode = this.cy.nodes('[type="user"]').first();
    if (userNode.length === 0) {
      console.error('[Interest Level Graph] User node not found');
      return;
    }
    
    const edge = this.cy.edges(`[source="${userNode.id()}"][target="${node.id()}"]`).first();
    const interestScore = edge.length > 0 ? edge.data('score') : 0;
    
    console.log('[Interest Level Graph] Navigate to Interest Dashboard:', {
      conceptName,
      conceptId,
      interestScore
    });
    
    // Navigate to the interest level dashboard page
    this.router.navigate(['/user/interest-level'], {
      queryParams: {
        conceptName,
        conceptId
      }
    });
  }

  private generateExplanationText(conceptName: string, activityCount: number): string {
    return `This score represents your level of interest in "${conceptName}" based on ${activityCount} learning ${activityCount === 1 ? 'activity' : 'activities'} across different courses in CourseMapper. Higher scores indicate stronger interest through interactions like viewing materials, marking concepts as Did Not Understand, and engaging with related concepts.`;
  }

  private handleToggleRelated(node: any): void {
    const conceptId = node.id();
    const conceptCid = node.data('conceptId');
    const wasVisible = this.checkForRelatedConcepts(node);
    
    if (wasVisible) {
      // Hide related concepts
      this.hideRelatedConcepts(conceptId);
      this.conceptsWithVisibleRelated.delete(conceptId);
      this.emitVisibleNodes();
    } else {
      // Fetch and show related concepts
      this.neo4jService.getRelatedConcepts(conceptCid).pipe(take(1)).subscribe({
        next: (response) => {
          this.showRelatedConcepts(node, response.relatedConcepts);
          this.conceptsWithVisibleRelated.add(conceptId);
          this.emitVisibleNodes();
        },
        error: (err) => {
          console.error('[Interest Level Graph] Failed to fetch related concepts:', err);
          this.messageService.add({
            severity: 'error',
            summary: 'Failed to Load',
            detail: 'Could not load related concepts'
          });
        }
      });
    }
  }

  private hideRelatedConcepts(mainConceptId: string): void {
    const relatedEdges = this.cy.edges(`[source="${mainConceptId}"][label="related_to"]`);
    
    relatedEdges.forEach((edge: any) => {
      const relatedNodeId = edge.data().target;
      const relatedNode = this.cy.getElementById(relatedNodeId);
      
      // Remove the relationship edge
      edge.remove();
      
      if (relatedNode.length > 0) {
        // Check if this related concept has other edges from other main concepts
        const otherRelatedEdges = this.cy.edges(`[target="${relatedNodeId}"][label="related_to"]`);
        
        // Only remove the node if no other main concepts are showing it
        if (otherRelatedEdges.length === 0) {
          relatedNode.remove();
        }
      }
    });
  }

  private showRelatedConcepts(mainConceptNode: any, relatedConcepts: any[]): void {
    if (!relatedConcepts || relatedConcepts.length === 0) {
      console.log('[Interest Level Graph] No related concepts to show');
      return;
    }

    const mainConceptId = mainConceptNode.id();
    const mainConceptPos = mainConceptNode.position();
    
    const radius = 250;
    const angleStep = (2 * Math.PI) / relatedConcepts.length;
    let angleOffset = 0;
    
    relatedConcepts.forEach((relatedConcept) => {
      const relatedNodeId = `concept-${relatedConcept.cid}`;
      
      // Check if node already exists
      const existingNode = this.cy.getElementById(relatedNodeId);
      
      if (existingNode.length === 0) {
        // Add related concept node
        this.cy.add({
          group: 'nodes',
          data: {
            id: relatedNodeId,
            label: relatedConcept.name,
            type: 'related_concept',
            conceptId: relatedConcept.cid,
            conceptName: relatedConcept.name,
            wikipedia: relatedConcept.wikipedia,
            abstract: relatedConcept.abstract,
          },
          position: {
            x: mainConceptPos.x + radius * Math.cos(angleOffset),
            y: mainConceptPos.y + radius * Math.sin(angleOffset)
          }
        });
      }
      
      // Add edge from main concept to related concept (if doesn't exist)
      const edgeId = `edge_${mainConceptId}_${relatedNodeId}`;
      const existingEdge = this.cy.getElementById(edgeId);
      
      if (existingEdge.length === 0) {
        this.cy.add({
          group: 'edges',
          data: {
            id: edgeId,
            source: mainConceptId,
            target: relatedNodeId,
            label: 'related_to'
          }
        });
      }
      
      angleOffset += angleStep;
    });
  }

  // Node position persistence methods
  private saveNodePositions(): void {
    if (!this.cy || !this.currentUser) return;
    
    const positions: { [key: string]: { x: number; y: number } } = {};
    
    this.cy.nodes().forEach((node: any) => {
      const pos = node.position();
      positions[node.id()] = { x: pos.x, y: pos.y };
    });
    
    const storageKey = `interest_graph_positions_${this.currentUser.id}`;
    sessionStorage.setItem(storageKey, JSON.stringify(positions));
    
    console.log('[Interest Level] Saved node positions to sessionStorage');
  }
  
  private getSavedNodePositions(): { [key: string]: { x: number; y: number } } | null {
    if (!this.currentUser) return null;
    
    const storageKey = `interest_graph_positions_${this.currentUser.id}`;
    const stored = sessionStorage.getItem(storageKey);
    
    if (stored) {
      try {
        const positions = JSON.parse(stored);
        console.log('[Interest Level] Loaded node positions from sessionStorage');
        return positions;
      } catch (e) {
        console.error('[Interest Level] Error parsing stored positions:', e);
        return null;
      }
    }
    
    return null;
  }
  
  private clearSavedNodePositions(): void {
    if (!this.currentUser) return;
    
    const storageKey = `interest_graph_positions_${this.currentUser.id}`;
    sessionStorage.removeItem(storageKey);
    
    console.log('[Interest Level] Cleared saved node positions');
  }
  
  private highlightEditedConcept(conceptId: string): void {
    if (!this.cy) return;
    
    // Find the node with this concept ID
    const node = this.cy.getElementById(`concept_${conceptId}`);
    
    if (node && node.length > 0) {
      // Add a temporary highlight class
      node.addClass('recently-edited');
      
      // Center on this node without zooming too much
      this.cy.animate({
        center: { eles: node },
        zoom: this.cy.zoom(), // Keep current zoom level
        duration: 500
      });
      
      // Flash the node
      let flashCount = 0;
      const flashInterval = setInterval(() => {
        if (flashCount < 4) {
          node.toggleClass('recently-edited');
          flashCount++;
        } else {
          clearInterval(flashInterval);
          node.addClass('recently-edited');
          // Remove highlight after a delay
          setTimeout(() => {
            node.removeClass('recently-edited');
          }, 3000);
        }
      }, 300);
      
      console.log('[Interest Level] Highlighted edited concept:', conceptId);
    }
  }
}

