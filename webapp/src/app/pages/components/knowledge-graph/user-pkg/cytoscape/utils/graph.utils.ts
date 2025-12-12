import cytoscape from 'cytoscape';
import { getCytoscapeStyles, CONCENTRIC_LAYOUT_CONFIG, CYTOSCAPE_ZOOM_CONFIG } from '../cytoscape.config';
import { ViewMode, UserPkgGraphData, CourseInfo } from '../../types/user-pkg.types';

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

export function updateEdgeStyles(cy: any, elements?: any): void {
  cy.edges().forEach((edge: any) => {
    const edgeType = edge.data('type');
    
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
    
    // Apply style based on current edge type
    applyEdgeStyle(edge, edge.data('type'));
  });
}

export function updateNodeStyles(cy: any): void {
  cy.nodes('[type!="user"][type!="course"]').forEach((node: any) => {
    const incomingEdges = node.connectedEdges().filter((edge: any) => 
      edge.data().target === node.id() && edge.data().source !== node.id()
    );
    
    const userEdge = incomingEdges.find((edge: any) => {
      const sourceNode = cy.getElementById(edge.data().source);
      return sourceNode.data().type === 'user';
    });
    
    if (userEdge) {
      applyNodeStyle(node, userEdge.data().type);
    }
  });
}

function applyEdgeStyle(edge: any, type: string): void {
  const styles: Record<string, any> = {
    'u': {
      'line-color': '#16A34A',
      'target-arrow-color': '#16A34A',
      'color': '#15803D'
    },
    'dnu': {
      'line-color': '#DC2626',
      'target-arrow-color': '#DC2626',
      'color': '#991B1B'
    },
    'default': {
      'line-color': '#9CA3AF',
      'target-arrow-color': '#9CA3AF',
      'color': '#374151'
    }
  };

  edge.style(styles[type] || styles['default']);
}

function applyNodeStyle(node: any, edgeType: string): void {
  const styles: Record<string, any> = {
    'dnu': {
      'background-color': '#DC2626',
      'border-color': '#991B1B'
    },
    'u': {
      'background-color': '#16A34A',
      'border-color': '#15803D'
    },
    'default': {
      'background-color': '#3B82F6',
      'border-color': '#1E40AF'
    }
  };

  node.style(styles[edgeType] || styles['default']);
}

export function getNodeStatus(node: any): string {
  // Get status from the incoming edge (from user node)
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
 */
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
