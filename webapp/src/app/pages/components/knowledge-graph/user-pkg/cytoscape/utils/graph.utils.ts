import cytoscape from 'cytoscape';
import { getCytoscapeStyles, CONCENTRIC_LAYOUT_CONFIG, CYTOSCAPE_ZOOM_CONFIG } from '../cytoscape.config';
import { ViewMode, UserPkgGraphData, CourseInfo } from '../../types/user-pkg.types';
import { 
  NodeType, 
  EdgeType,
  EDGE_STYLES, 
  NODE_STYLES,
  VIEW_MODE_CONFIG,
  getEdgeLabel,
  getEdgeStyle,
  getNodeStyle
} from '../../graph-model';

/**
 * Graph utility functions for Cytoscape operations
 */

export function createGraph(container: HTMLElement, elements: any): any {
  return cytoscape({
    container: container,
    minZoom: CYTOSCAPE_ZOOM_CONFIG.min,
    maxZoom: CYTOSCAPE_ZOOM_CONFIG.max,
    style: getCytoscapeStyles(),
    elements: elements,
    autounselectify: false,
  });
}

export function applyConcentricLayout(cy: any): void {
  cy.layout(CONCENTRIC_LAYOUT_CONFIG).run();
}

/**
 * Update edge styles based on view mode
 * Skips engagement edges (they use default CSS styling)
 */
export function updateEdgeStyles(cy: any, viewMode: ViewMode, elements?: any): void {
  cy.edges().forEach((edge: any) => {
    const edgeType = edge.data('type') as EdgeType;
    
    // Skip engagement edges - they use default CSS styling
    if (edgeType === 'engagement') {
      return;
    }
    
    const sourceNode = edge.source();
    const targetNode = edge.target();
    const sourceType = sourceNode.data('type') as NodeType;
    const targetType = targetNode.data('type') as NodeType;
    
    // If elements provided, try to sync from elements data
    if (elements?.edges) {
      const source = edge.data('source');
      const target = edge.data('target');
      const edgeData = elements.edges.find((e: any) => 
        e.data.source === source && e.data.target === target
      );
      if (edgeData && edgeData.data.type !== edgeType) {
        edge.data('type', edgeData.data.type);
      }
    }
    
    // Get style based on view mode and edge context
    const styleConfig = getEdgeStyle(viewMode, sourceType, targetType, edgeType as any);
    applyEdgeStyleFromConfig(edge, styleConfig);
  });
}

/**
 * Update node styles based on view mode
 * Only updates concept nodes - user and course nodes keep their original styles
 */
export function updateNodeStyles(cy: any, viewMode: ViewMode): void {
  // Only update concept nodes (main_concept and related_concept)
  // User and course nodes should not be updated
  cy.nodes('[type="main_concept"], [type="related_concept"]').forEach((node: any) => {
    const nodeType = node.data('type') as NodeType;
    
    // Get understanding status - check multiple sources
    let understandingStatus: 'u' | 'dnu' | 'unknown' = 'unknown';
    
    // 1. First try from node's relationshipType data (always available, set when node created)
    const nodeRelationshipType = node.data('relationshipType');
    if (nodeRelationshipType === 'u' || nodeRelationshipType === 'dnu') {
      understandingStatus = nodeRelationshipType;
    }
    
    // 2. Then check incoming user edge (may override node data if edge was updated)
    const incomingEdges = node.connectedEdges().filter((edge: any) => 
      edge.data().target === node.id()
    );
    
    const userEdge = incomingEdges.find((edge: any) => {
      const sourceNode = cy.getElementById(edge.data().source);
      return sourceNode.data().type === 'user';
    });
    
    if (userEdge) {
      const edgeType = userEdge.data('type');
      if (edgeType === 'u' || edgeType === 'dnu') {
        understandingStatus = edgeType;
      }
    }
    
    const styleConfig = getNodeStyle(viewMode, nodeType, understandingStatus);
    applyNodeStyleFromConfig(node, styleConfig);
  });
}

/**
 * Apply edge style from configuration
 */
function applyEdgeStyleFromConfig(edge: any, config: { color: string; arrowColor: string; textColor: string }): void {
  edge.style({
    'line-color': config.color,
    'target-arrow-color': config.arrowColor,
    'color': config.textColor
  });
}

/**
 * Apply node style from configuration
 */
function applyNodeStyleFromConfig(node: any, config: { backgroundColor: string; borderColor: string }): void {
  node.style({
    'background-color': config.backgroundColor,
    'border-color': config.borderColor
  });
}

export function getNodeStatus(node: any): string {
  // First check node's relationshipType data (always available, especially for related concepts)
  const nodeRelationshipType = node.data('relationshipType');
  if (nodeRelationshipType === 'u' || nodeRelationshipType === 'dnu') {
    return nodeRelationshipType;
  }
  
  // Fallback: Get status from the incoming edge (from user node)
  const incomingEdges = node.connectedEdges().filter((edge: any) => 
    edge.data('target') === node.id()
  );
  
  for (const edge of incomingEdges) {
    const edgeType = edge.data('type');
    if (edgeType === 'u' || edgeType === 'dnu') {
      return edgeType;
    }
  }
  
  return 'new';
}

/**
 * Create engagement view graph data (user -> courses)
 */
export function createEngagementGraphData(
  userNode: any,
  courses: CourseInfo[]
): UserPkgGraphData {
  const nodes: any[] = [];
  const edges: any[] = [];
  
  if (userNode) {
    nodes.push(userNode);
  }
  
  let edgeIndex = 0;
  courses.forEach(course => {
    if (course.courseId) {
      const engagementLevel = course.engagementLevel || 'low';
      const engagementLevelCapitalized = capitalizeEngagementLevel(engagementLevel);
      
      nodes.push({
        data: {
          id: `course-${course.courseId}`,
          name: course.courseName || course.courseShortName || 'Unknown Course',
          type: 'course',
          courseId: course.courseId,
          engagementLevel: engagementLevel
        }
      });
      
      edges.push({
        data: {
          id: `edge-${edgeIndex++}`,
          source: userNode?.data.id,
          target: `course-${course.courseId}`,
          type: 'engagement',
          label: `Engaged (${engagementLevelCapitalized})`,
          engagementLevel: engagementLevel
        }
      });
    }
  });
  
  return { nodes, edges };
}

/**
 * Get edge label based on view mode and relationship type
 * Uses the centralized graph model configuration
 * 
 * @param edgeType - The edge type (u, dnu, related_to, etc.)
 * @param viewMode - Current view mode (knowledge, interest, engagement)
 * @param sourceType - Source node type
 * @param targetType - Target node type
 * @param score - Optional score for interest/engagement edges
 */
<<<<<<< HEAD
export function getEdgeLabelForViewMode(edgeType: string | undefined, viewMode: ViewMode, sourceType?: string, targetType?: string): string {
  // Handle user -> course relationship in knowledge mode
  if (viewMode === 'knowledge' && sourceType === 'user' && targetType === 'course') {
    return 'Enrolled In';
  }
  
  // Handle relationship type labels
  if (edgeType === 'u') {
    return 'Understood';
  } else if (edgeType === 'dnu') {
    return 'Not Understood';
  } else if (edgeType === 'related_to') {
    return 'Related To';
  }

  // For other view modes
  switch (viewMode) {
    case 'interest':
      return 'interested in';
    case 'engagement':
      // For engagement view, the label should already include engagement level
      // Return the edge label if it exists, otherwise fallback
      return edgeType || 'engaged in';
    default:
      return edgeType || '';
  }
=======
export function getEdgeLabelForViewMode(
  edgeType: string | undefined, 
  viewMode: ViewMode, 
  sourceType?: string, 
  targetType?: string,
  score?: number
): string {
  return getEdgeLabel(
    viewMode,
    (sourceType || 'user') as NodeType,
    (targetType || 'main_concept') as NodeType,
    edgeType as 'u' | 'dnu' | 'unknown',
    score
  );
>>>>>>> origin/dev2-monir-pkg
}

/**
 * Capitalize first letter of engagement level
 */
export function capitalizeEngagementLevel(level: string | undefined): string {
  if (!level) return 'Low';
  return level.charAt(0).toUpperCase() + level.slice(1).toLowerCase();
}

/**
 * Get edge width based on engagement level
 */
export function getEngagementEdgeWidth(engagementLevel: string | undefined): number {
  const level = (engagementLevel || 'low').toLowerCase();
  switch (level) {
    case 'high':
      return 6;
    case 'medium':
      return 4;
    case 'low':
    default:
      return 2;
  }
}

/**
 * Get course node size based on engagement level
 */
export function getEngagementNodeSize(engagementLevel: string | undefined): number {
  const level = (engagementLevel || 'low').toLowerCase();
  switch (level) {
    case 'high':
      return 100;
    case 'medium':
      return 85;
    case 'low':
    default:
      return 70;
  }
}
