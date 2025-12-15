/**
 * Personal Knowledge Graph - Graph Model Definitions
 * 
 * This file defines the complete graph structure for all view modes.
 * 
 */

import { ViewMode } from './types/user-pkg.types';

// ============================================================================
// NODE TYPE DEFINITIONS
// ============================================================================

export type NodeType = 'user' | 'main_concept' | 'related_concept' | 'course';

// ============================================================================
// EDGE TYPE DEFINITIONS
// ============================================================================

/**
 * Edge types used in the graph
 */
export type EdgeType = 
  | 'u'           // Understood (Knowledge mode: User → Concept)
  | 'dnu'         // Did Not Understand (Knowledge mode: User → Concept)
  | 'unknown'     // Unknown/New concept status
  | 'interest'    // Interested In (Interest mode: User → Concept)
  | 'enrolled'    // Enrolled In (Knowledge/Interest mode: User → Course)
  | 'engagement'  // Engaged In (Engagement mode: User → Course)
  | 'related_to'; // Related To (Main Concept → Related Concept)

// ============================================================================
// EDGE CONFIGURATION PER VIEW MODE
// ============================================================================

export interface EdgeConfig {
  label: string;
  color: string;
  arrowColor: string;
  textColor: string;
  showScore?: boolean;  // For interest score or engagement level
}

/**
 * Edge styling configuration for each edge type
 */
export const EDGE_STYLES: Record<EdgeType, EdgeConfig> = {
  'u': {
    label: 'Understood',
    color: '#16A34A',
    arrowColor: '#16A34A',
    textColor: '#15803D'
  },
  'dnu': {
    label: 'Not Understood',
    color: '#DC2626',
    arrowColor: '#DC2626',
    textColor: '#991B1B'
  },
  'unknown': {
    label: '',
    color: '#9CA3AF',
    arrowColor: '#9CA3AF',
    textColor: '#374151'
  },
  'interest': {
    label: 'Interested In',
    color: '#8B5CF6',
    arrowColor: '#8B5CF6',
    textColor: '#6D28D9',
    showScore: true
  },
  'enrolled': {
    label: 'Enrolled In',
    color: '#6B5D3F',
    arrowColor: '#6B5D3F',
    textColor: '#44403C'
  },
  'engagement': {
    label: 'Engaged In',
    color: '#92400E',
    arrowColor: '#92400E',
    textColor: '#78350F',
    showScore: true
  },
  'related_to': {
    label: 'Related To',
    color: '#9CA3AF',
    arrowColor: '#9CA3AF',
    textColor: '#6B7280'
  }
};

// ============================================================================
// NODE STYLING CONFIGURATION
// ============================================================================

export interface NodeStyleConfig {
  backgroundColor: string;
  borderColor: string;
}

export const NODE_STYLES: Record<string, NodeStyleConfig> = {
  'u': {
    backgroundColor: '#16A34A',
    borderColor: '#15803D'
  },
  'dnu': {
    backgroundColor: '#DC2626',
    borderColor: '#991B1B'
  },
  'unknown': {
    backgroundColor: '#3B82F6',
    borderColor: '#1E40AF'
  },
  'interest': {
    backgroundColor: '#8B5CF6',
    borderColor: '#6D28D9'
  },
  'user': {
    backgroundColor: '#3B82F6',
    borderColor: '#1E40AF'
  },
  'course': {
    backgroundColor: '#92400E',
    borderColor: '#78350F'
  }
};

// ============================================================================
// VIEW MODE CONFIGURATION
// ============================================================================

export interface ViewModeConfig {
  showMainConcepts: boolean;
  showRelatedConcepts: boolean;
  showCourses: boolean;
  userToConceptEdgeType: EdgeType | null;
  userToCourseEdgeType: EdgeType;
  conceptNodeStyle: string;  // Key for NODE_STYLES
}

export const VIEW_MODE_CONFIG: Record<ViewMode, ViewModeConfig> = {
  'knowledge': {
    showMainConcepts: true,
    showRelatedConcepts: true,  // On-demand
    showCourses: true,
    userToConceptEdgeType: null,  // Uses 'u' or 'dnu' from data
    userToCourseEdgeType: 'enrolled',
    conceptNodeStyle: 'dynamic'  // Based on understanding status
  },
  'interest': {
    showMainConcepts: true,
    showRelatedConcepts: true,  // On-demand
    showCourses: true,
    userToConceptEdgeType: null,  // Uses 'u' or 'dnu' from data (same colors as knowledge)
    userToCourseEdgeType: 'enrolled',
    conceptNodeStyle: 'dynamic'  // Same as knowledge - based on understanding status
  },
  'engagement': {
    showMainConcepts: false,
    showRelatedConcepts: false,
    showCourses: true,
    userToConceptEdgeType: null,
    userToCourseEdgeType: 'engagement',
    conceptNodeStyle: 'none'
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get the appropriate edge label for a given context
 */
export function getEdgeLabel(
  viewMode: ViewMode,
  sourceType: NodeType,
  targetType: NodeType,
  understandingStatus?: 'u' | 'dnu' | 'unknown',
  score?: number
): string {
  const config = VIEW_MODE_CONFIG[viewMode];
  
  // Main Concept → Related Concept edge
  if ((sourceType === 'main_concept' || sourceType === 'related_concept') && 
      targetType === 'related_concept') {
    return EDGE_STYLES['related_to'].label;
  }
  
  // User → Course edge
  if (sourceType === 'user' && targetType === 'course') {
    const edgeType = config.userToCourseEdgeType;
    const style = EDGE_STYLES[edgeType];
    if (style.showScore && score !== undefined) {
      return `${style.label} (${score.toFixed(5)})`;
    }
    return `score: ${score.toFixed(5)}`;
  }
  
  // User → Concept edge
  if (sourceType === 'user' && (targetType === 'main_concept' || targetType === 'related_concept')) {
    // In Knowledge mode, use understanding status
    if (viewMode === 'knowledge') {
      const status = understandingStatus || 'unknown';
      return EDGE_STYLES[status].label;
    }
    
    // In Interest mode, use interest edge
    if (viewMode === 'interest') {
      const style = EDGE_STYLES['interest'];
      if (style.showScore && score !== undefined) {
        return `Interested_in : score (${score.toFixed(5).replace('.', ',')})`;
      }
      return style.label;
    }
  }
  
  return '';
}

/**
 * Get the edge style configuration for a given context
 */
export function getEdgeStyle(
  viewMode: ViewMode,
  sourceType: NodeType,
  targetType: NodeType,
  understandingStatus?: 'u' | 'dnu' | 'unknown'
): EdgeConfig {
  // Related To edge
  if ((sourceType === 'main_concept' || sourceType === 'related_concept') && 
      targetType === 'related_concept') {
    return EDGE_STYLES['related_to'];
  }
  
  // User → Course edge
  if (sourceType === 'user' && targetType === 'course') {
    const config = VIEW_MODE_CONFIG[viewMode];
    return EDGE_STYLES[config.userToCourseEdgeType];
  }
  
  // User → Concept edge (both knowledge and interest use understanding status for colors)
  if (sourceType === 'user' && (targetType === 'main_concept' || targetType === 'related_concept')) {
    const status = understandingStatus || 'unknown';
    return EDGE_STYLES[status];
  }
  
  return EDGE_STYLES['unknown'];
}

/**
 * Get the node style configuration for a given context
 */
export function getNodeStyle(
  viewMode: ViewMode,
  nodeType: NodeType,
  understandingStatus?: 'u' | 'dnu' | 'unknown'
): NodeStyleConfig {
  // User node - always use user style, never change
  if (nodeType === 'user') {
    return NODE_STYLES['user'];
  }
  
  // Course node - always use course style
  if (nodeType === 'course') {
    return NODE_STYLES['course'];
  }
  
  // Concept nodes (main_concept or related_concept)
  // Both knowledge and interest modes use understanding status for colors
  const status = understandingStatus || 'unknown';
  return NODE_STYLES[status] || NODE_STYLES['unknown'];
}

/**
 * Check if a node type should be visible in a given view mode
 */
export function isNodeVisibleInViewMode(nodeType: NodeType, viewMode: ViewMode): boolean {
  const config = VIEW_MODE_CONFIG[viewMode];
  
  if (nodeType === 'user') return true;
  if (nodeType === 'course') return config.showCourses;
  if (nodeType === 'main_concept') return config.showMainConcepts;
  if (nodeType === 'related_concept') return config.showRelatedConcepts;
  
  return false;
}
