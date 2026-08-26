import { Component, Output, EventEmitter, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, combineLatest } from 'rxjs';
import { takeUntil, distinctUntilChanged, take } from 'rxjs/operators';
import cytoscape from 'cytoscape';
import fcose from 'cytoscape-fcose';
import cxtmenu from 'cytoscape-cxtmenu';
import * as GraphUtils from './utils/graph.utils';
import * as CourseNodeUtils from './utils/course-node.utils';
import * as RelatedConceptsUtils from './utils/related-concepts.utils';
import * as ContextMenuUtils from './utils/context-menu.utils';
import { ConceptRecord, ViewMode, CourseInfo, AdvancedFilters } from '../types/user-pkg.types';
import * as UserPkgSelectors from '../state/user-pkg.reducer';
import { Neo4jService } from 'src/app/services/neo4j.service';

cytoscape.use(fcose);
cytoscape.use(cxtmenu);

@Component({
  selector: 'app-cytoscape-pkg',
  templateUrl: './cytoscape-pkg.component.html',
  styleUrls: ['./cytoscape-pkg.component.css']
})
export class CytoscapePkgComponent implements OnInit, OnDestroy {
  @Output() conceptSelected = new EventEmitter<any>();
  @Output() conceptStatusChanged = new EventEmitter<{concept: any, status: 'u' | 'dnu' | 'new'}>();
  @Output() courseNodeClicked = new EventEmitter<any>();
  @Output() courseEngagementDashboardRequested = new EventEmitter<any>();
  @Output() courseViewRequested = new EventEmitter<any>();
  @Output() courseDetailsRequested = new EventEmitter<any>();
  @Output() edgeClicked = new EventEmitter<any>();
  @Output() visibleNodesChanged = new EventEmitter<any[]>();

  public cy: any;
  private conceptsWithVisibleRelated = new Set<string>();
  private destroy$ = new Subject<void>();
  
  // State from store
  private elements: any;
  private rawConceptRecords: ConceptRecord[] = [];
  private courses: CourseInfo[] = [];
  private currentViewMode: ViewMode = 'knowledge';
  private currentSearchQuery = '';
  private currentUnderstandingStatus: 'all' | 'u' | 'dnu' = 'all';
  private currentAdvancedFilters: AdvancedFilters | null = null;

  constructor(
    private renderer: Renderer2,
    private store: Store,
    private neo4jService: Neo4jService
  ) {}

  ngOnInit(): void {
    console.log('[Cytoscape PKG] Component initialized');
    this.listenToStoreChanges();
  }

  private listenToStoreChanges(): void {
    // Subscribe to graph data, raw records, and courses together
    // Use selectGraphDataWithScores to get enriched data with interest scores
    combineLatest([
      this.store.select(UserPkgSelectors.selectGraphDataWithScores),
      this.store.select(UserPkgSelectors.selectRawRecords),
      this.store.select(UserPkgSelectors.selectCourses)
    ]).pipe(takeUntil(this.destroy$))
      .subscribe(([graphData, rawConceptRecords, courses]) => {
        this.rawConceptRecords = rawConceptRecords;
        this.courses = courses;
        
        if (!graphData) return;
        
        const previousNodes = this.elements?.nodes || [];
        const currentNodes = graphData.nodes || [];
        
        const previousNodeIds = new Set(previousNodes.map((n: any) => n.data.id));
        const currentNodeIds = new Set(currentNodes.map((n: any) => n.data.id));
        
        const sameNodes = previousNodeIds.size === currentNodeIds.size &&
                          [...previousNodeIds].every(id => currentNodeIds.has(id));
        
        this.elements = graphData;
        
        if (this.cy && previousNodes.length > 0 && sameNodes) {
          console.log('[Cytoscape PKG] Updating styles only');
          // Update edge data in Cytoscape with enriched data (including scores)
          this.updateCytoscapeEdgeData(graphData.edges);
          this.updateGraphStyles();
        } else if (graphData.nodes.length > 0) {
          console.log('[Cytoscape PKG] Full re-render');
          this.render();
        }
      });

    // Subscribe to view mode
    this.store.select(UserPkgSelectors.selectViewMode)
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(viewMode => {
        const previousViewMode = this.currentViewMode;
        this.currentViewMode = viewMode;
        if (this.cy && previousViewMode !== viewMode) {
          console.log('[Cytoscape PKG] View mode changed:', viewMode);
          // Clear related concepts tracking when switching view modes
          this.conceptsWithVisibleRelated.clear();
          this.render();
        }
      });

    // Subscribe to search query
    this.store.select(UserPkgSelectors.selectSearchQuery)
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(query => {
        this.currentSearchQuery = query;
        if (this.cy) {
          this.applyFilters();
        }
      });

    // Subscribe to understanding status
    this.store.select(UserPkgSelectors.selectUnderstandingStatus)
      .pipe(takeUntil(this.destroy$), distinctUntilChanged())
      .subscribe(status => {
        this.currentUnderstandingStatus = status;
        if (this.cy) {
          this.applyFilters();
        }
      });

    // Subscribe to advanced filters
    this.store.select(UserPkgSelectors.selectAdvancedFilters)
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.currentAdvancedFilters = filters;
        if (this.cy) {
          this.applyFilters();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Apply all filters (search query, understanding status, advanced filters) to nodes
   */
  private applyFilters(): void {
    if (!this.cy) return;
    
    const query = this.currentSearchQuery?.toLowerCase().trim() || '';
    const status = this.currentUnderstandingStatus;
    const advancedFilters = this.currentAdvancedFilters;
    
    // Build a set of allowed concept IDs based on advanced filters
    const allowedConceptIds = this.getFilteredConceptIds(advancedFilters);
    
    this.cy.nodes().forEach((node: any) => {
      const nodeType = node.data('type');
      const nodeName = node.data('name')?.toLowerCase() || '';
      const nodeCid = node.data('cid');
      
      // Always show user node
      if (nodeType === 'user') {
        node.show();
        return;
      }
      
      // Check advanced filters (course/material/slide selection)
      if (allowedConceptIds !== null && nodeType !== 'course') {
        if (!allowedConceptIds.has(nodeCid)) {
          node.hide();
          return;
        }
      }
      
      // Check understanding status filter
      if (status !== 'all') {
        const nodeStatus = GraphUtils.getNodeStatus(node);
        if (nodeStatus !== status) {
          node.hide();
          return;
        }
      }
      
      // Check search query filter
      if (query && !nodeName.includes(query)) {
        node.hide();
        return;
      }
      
      node.show();
    });
    
    // Hide/show edges based on connected node visibility
    this.cy.edges().forEach((edge: any) => {
      const sourceNode = this.cy.getElementById(edge.data('source'));
      const targetNode = this.cy.getElementById(edge.data('target'));
      
      if (sourceNode.visible() && targetNode.visible()) {
        edge.show();
      } else {
        edge.hide();
      }
    });
    
    this.emitVisibleNodes();
  }


  private getFilteredConceptIds(filters: AdvancedFilters | null): Set<string> | null {
    // Advanced filters are handled server-side, so we don't need to filter client-side
    // Return null to show all loaded concepts
    return null;
  }


  render(): void {
    if (!this.elements || !this.elements.nodes) {
      console.log('[Cytoscape PKG] No elements to render');
      return;
    }

    const container = this.renderer.selectRootElement('#cy-pkg', true);
    if (!container) {
      console.error('[Cytoscape PKG] Container #cy-pkg not found');
      return;
    }

    if (this.cy) {
      this.cy.destroy();
    }

    // Determine what to render based on view mode
    // Deep clone to avoid mutating frozen NgRx store data
    let elementsToRender: any;
    
    if (this.currentViewMode === 'engagement') {
      // Create engagement view (user -> courses)
      const userNode = this.elements.nodes.find((n: any) => n.data.type === 'user');
      elementsToRender = GraphUtils.createEngagementGraphData(userNode, this.courses);
    } else {
      // Deep clone elements for knowledge/interest view
      elementsToRender = {
        nodes: this.elements.nodes.map((n: any) => ({ ...n, data: { ...n.data } })),
        edges: this.elements.edges.map((e: any) => ({ ...e, data: { ...e.data } }))
      };
    }

    console.log(`[Cytoscape PKG] Rendering ${elementsToRender.nodes.length} nodes and ${elementsToRender.edges.length} edges (${this.currentViewMode} view)`);

    this.cy = GraphUtils.createGraph(container, elementsToRender);
    
    // Apply edge labels and styles based on view mode
    this.applyEdgeLabels();
    GraphUtils.updateNodeStyles(this.cy, this.currentViewMode);
    GraphUtils.updateEdgeStyles(this.cy, this.currentViewMode);
    
    GraphUtils.applyConcentricLayout(this.cy);
    this.setupEventListeners();
    this.initializeContextMenu();
    
    // Only restore related concepts in knowledge/interest view
    if (this.currentViewMode !== 'engagement') {
      this.restoreRelatedConcepts();
      this.applyFilters();
    }

    console.log('[Cytoscape PKG] Graph rendered successfully');
    this.emitVisibleNodes();
  }

  /**
   * Apply edge labels based on current view mode
   */
  private applyEdgeLabels(): void {
    this.cy.edges().forEach((edge: any) => {
      // For engagement view, preserve the label that already includes engagement level
      if (this.currentViewMode === 'engagement' && edge.data('engagementLevel')) {
        // Label should already be set in createEngagementGraphData, so don't override it
        return;
      }
      
      const edgeType = edge.data('type');
      const sourceNode = edge.source();
      const targetNode = edge.target();
      const sourceType = sourceNode.data('type');
      const targetType = targetNode.data('type');
      const interestScore = edge.data('interestScore'); // Get interest score from edge data
      
      // Debug logging
      if (this.currentViewMode === 'interest' && sourceType === 'user') {
        console.log('Edge:', edge.data('id'), 'Type:', edgeType, 'Score:', interestScore, 'Target:', targetNode.data('cid'));
      }
      
      const label = GraphUtils.getEdgeLabelForViewMode(
        edgeType, 
        this.currentViewMode,
        sourceType,
        targetType,
        interestScore // Pass score to label function
      );
      
      // Debug logging
      if (this.currentViewMode === 'interest' && sourceType === 'user') {
        console.log('Generated label:', label);
      }
      
      edge.data('label', label);
    });
  }

  private restoreRelatedConcepts(): void {
    const conceptsToRestore = Array.from(this.conceptsWithVisibleRelated);
    conceptsToRestore.forEach(conceptId => {
      const conceptNode = this.cy.getElementById(conceptId);
      if (conceptNode.length > 0) {
        const conceptCid = conceptNode.data('cid');
        // Re-fetch related concepts on-demand
        this.neo4jService.getRelatedConcepts(conceptCid).pipe(take(1)).subscribe({
          next: (response) => {
            RelatedConceptsUtils.showRelatedConcepts(this.cy, conceptNode, response.relatedConcepts, this.currentViewMode);
          },
          error: (err) => {
            console.error('[Cytoscape PKG] Failed to restore related concepts:', err);
            this.conceptsWithVisibleRelated.delete(conceptId);
          }
        });
      } else {
        this.conceptsWithVisibleRelated.delete(conceptId);
      }
    });
  }

  private setupEventListeners(): void {
    // Node click events
    this.cy.on('tap', 'node', (event: any) => {
      const node = event.target;
      const nodeData = node.data();
      
      if (nodeData.type === 'course') {
        this.courseNodeClicked.emit(nodeData);
      } else if (nodeData.type === 'main_concept' || nodeData.type === 'related_concept') {
        console.log('[Cytoscape PKG] Concept clicked:', nodeData);
        this.conceptSelected.emit(nodeData);
      }
    });

    // Edge click events
    this.cy.on('tap', 'edge', (event: any) => {
      const edge = event.target;
      this.edgeClicked.emit(edge.data());
    });

    // Hover tooltips for nodes
    let tooltipDiv: HTMLElement | null = null;
    const hideTooltip = () => {
      if (tooltipDiv) {
        this.renderer.setStyle(tooltipDiv, 'display', 'none');
      }
    };

    this.cy.on('mouseover', 'node[type="main_concept"], node[type="related_concept"], node[type="course"]', () => {
      // Create tooltip if it doesn't exist
      if (!tooltipDiv) {
        tooltipDiv = this.renderer.createElement('div');
        this.renderer.setStyle(tooltipDiv, 'position', 'absolute');
        this.renderer.setStyle(tooltipDiv, 'background', 'rgba(0, 0, 0, 0.85)');
        this.renderer.setStyle(tooltipDiv, 'color', 'white');
        this.renderer.setStyle(tooltipDiv, 'padding', '8px 12px');
        this.renderer.setStyle(tooltipDiv, 'border-radius', '6px');
        this.renderer.setStyle(tooltipDiv, 'font-size', '12px');
        this.renderer.setStyle(tooltipDiv, 'pointer-events', 'none');
        this.renderer.setStyle(tooltipDiv, 'z-index', '9999');
        this.renderer.setStyle(tooltipDiv, 'white-space', 'nowrap');
        this.renderer.setStyle(tooltipDiv, 'box-shadow', '0 2px 8px rgba(0,0,0,0.3)');
        this.renderer.appendChild(document.body, tooltipDiv);
      }

      // Set tooltip text based on node type
      const tooltipText = 'Right-click and hold to show options';

      
      this.renderer.setProperty(tooltipDiv, 'textContent', tooltipText);
      this.renderer.setStyle(tooltipDiv, 'display', 'block');
    });

    this.cy.on('mousemove', 'node[type="main_concept"], node[type="related_concept"], node[type="course"]', (event: any) => {
      if (tooltipDiv) {
        const mouseX = event.originalEvent.clientX;
        const mouseY = event.originalEvent.clientY;
        this.renderer.setStyle(tooltipDiv, 'left', `${mouseX + 15}px`);
        this.renderer.setStyle(tooltipDiv, 'top', `${mouseY + 15}px`);
      }
    });

    this.cy.on('mouseout', 'node[type="main_concept"], node[type="related_concept"], node[type="course"]', hideTooltip);

    // Ensure hover tooltip is hidden when the context-menu gesture starts/ends.
    this.cy.on('cxttapstart', 'node[type="main_concept"], node[type="related_concept"], node[type="course"]', hideTooltip);
    this.cy.on('cxttapend', 'node[type="main_concept"], node[type="related_concept"], node[type="course"]', hideTooltip);
    this.cy.on('tapend', 'node[type="main_concept"], node[type="related_concept"], node[type="course"]', hideTooltip);
    this.cy.on('tap', 'node[type="main_concept"], node[type="related_concept"], node[type="course"]', hideTooltip);
  }

  private initializeContextMenu(): void {
    ContextMenuUtils.initializeContextMenu(this.cy, this.rawConceptRecords, {
      onStatusChange: (concept, status) => this.handleStatusChange(concept, status),
      onToggleCourse: (node) => this.handleToggleCourse(node),
      onToggleRelated: (node) => this.handleToggleRelated(node),
      onViewEngagementDashboard: (courseData) => this.handleViewEngagementDashboard(courseData),
      onViewCourse: (courseData) => this.handleViewCourse(courseData),
      onShowCourseDetails: (courseData) => this.handleShowCourseDetails(courseData),
    });
  }

  private handleStatusChange(concept: any, status: 'u' | 'dnu' | 'new'): void {
    this.conceptStatusChanged.emit({ concept, status });
    
    // Immediately update the graph visuals
    const conceptNode = this.cy.$id(concept.id);
    if (conceptNode.length > 0) {
      const edgeType = status === 'new' ? 'unknown' : status;
      
      // Update the node's relationshipType data (important for related concepts in Interest mode)
      conceptNode.data('relationshipType', edgeType);
      
      // Update the edge from user to this concept (if it exists)
      const userEdge = this.cy.edges().filter((edge: any) => {
        if (edge.data('target') !== concept.id) return false;
        const sourceNode = this.cy.$id(edge.data('source'));
        return sourceNode.length > 0 && sourceNode.data('type') === 'user';
      });
      
      if (userEdge.length > 0) {
        userEdge.data('type', edgeType);
        // Update the label based on current view mode
        const interestScore = userEdge.data('interestScore'); // Get interest score from edge data
        const edgeLabel = GraphUtils.getEdgeLabelForViewMode(
          edgeType,
          this.currentViewMode,
          'user',
          conceptNode.data('type'),
          interestScore // Pass score to label function
        );
        userEdge.data('label', edgeLabel);
      }
      
      // Re-apply styles based on new edge type
      GraphUtils.updateNodeStyles(this.cy, this.currentViewMode);
      GraphUtils.updateEdgeStyles(this.cy, this.currentViewMode);
      
      // Emit visible nodes to update the legend
      this.emitVisibleNodes();
    }
  }

  private handleToggleCourse(node: any): void {
    CourseNodeUtils.toggleCourseNode(this.cy, node, this.rawConceptRecords);
    this.emitVisibleNodes();
  }

  private handleToggleRelated(node: any): void {
    const conceptId = node.id();
    const conceptCid = node.data('cid');
    const wasVisible = RelatedConceptsUtils.checkForRelatedConcepts(this.cy, node);
    
    if (wasVisible) {
      // Hide related concepts (no API call needed)
      RelatedConceptsUtils.hideRelatedConcepts(this.cy, conceptId);
      this.conceptsWithVisibleRelated.delete(conceptId);
      this.emitVisibleNodes();
    } else {
      // Fetch related concepts on-demand
      this.neo4jService.getRelatedConcepts(conceptCid).pipe(take(1)).subscribe({
        next: (response) => {
          RelatedConceptsUtils.showRelatedConcepts(this.cy, node, response.relatedConcepts, this.currentViewMode);
          this.conceptsWithVisibleRelated.add(conceptId);
          this.emitVisibleNodes();
        },
        error: (err) => {
          console.error('[Cytoscape PKG] Failed to fetch related concepts:', err);
        }
      });
    }
  }

  private handleViewEngagementDashboard(courseData: any): void {
    console.log('[Cytoscape PKG] View engagement dashboard requested for course:', courseData);
    this.courseEngagementDashboardRequested.emit(courseData);
  }

  private handleViewCourse(courseData: any): void {
    console.log('[Cytoscape PKG] View course requested:', courseData);
    this.courseViewRequested.emit(courseData);
  }

  private handleShowCourseDetails(courseData: any): void {
    console.log('[Cytoscape PKG] Show course details requested:', courseData);
    this.courseDetailsRequested.emit(courseData);
  }

  updateGraphStyles(): void {
    if (!this.cy) return;
    this.applyEdgeLabels(); // Re-apply labels when styles update (includes interest scores)
    GraphUtils.updateEdgeStyles(this.cy, this.currentViewMode, this.elements);
    GraphUtils.updateNodeStyles(this.cy, this.currentViewMode);
  }

  /**
   * Update Cytoscape edge data with enriched data from the selector
   * This is needed to sync interest scores into the Cytoscape instance
   */
  private updateCytoscapeEdgeData(edges: any[]): void {
    if (!this.cy) return;
    
    console.log('[Cytoscape PKG] Updating edge data in Cytoscape');
    edges.forEach(edge => {
      const cyEdge = this.cy.$id(edge.data.id);
      if (cyEdge.length > 0) {
        // Update edge data with enriched properties (like interestScore)
        Object.keys(edge.data).forEach(key => {
          cyEdge.data(key, edge.data[key]);
        });
      }
    });
  }

  private emitVisibleNodes(): void {
    if (!this.cy) return;
    
    const visibleNodes: any[] = [];
    this.cy.nodes().forEach((node: any) => {
      if (node.visible()) {
        visibleNodes.push(node.data());
      }
    });
    
    this.visibleNodesChanged.emit(visibleNodes);
  }
}
