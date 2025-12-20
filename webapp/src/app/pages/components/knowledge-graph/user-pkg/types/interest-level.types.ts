/**
 * Types for Interest Level Graph View
 * This view displays ONLY INTERESTED_IN relationships from Neo4j
 */

/**
 * Interest concept from backend API
 */
export interface InterestConcept {
  conceptId: string;
  conceptName: string;
  interestScore: number | null;
  wikipedia?: string;
  abstract?: string;
  courseName?: string;
  courseShortName?: string;
  allConceptIds?: string[]; // All concept IDs sharing the same name (for batch updates)
  activityCount?: number; // Total number of activities related to this concept
}

/**
 * API Response from GET /api/pkg/:userId/interests
 */
export interface InterestConceptsResponse {
  userId: string;
  concepts: InterestConcept[];
}

/**
 * Cytoscape node for Interest Level graph
 */
export interface InterestGraphNode {
  data: {
    id: string;
    label: string;
    type: 'user' | 'concept';
    conceptId?: string;
    conceptName?: string;
    wikipedia?: string;
    abstract?: string;
    interestScore?: number | null;
  };
}

/**
 * Cytoscape edge for Interest Level graph
 */
export interface InterestGraphEdge {
  data: {
    id: string;
    source: string;
    target: string;
    label: string;
    interestScore: number | null;
    relationshipType: 'interested_in';
    tooltip?: string;
    activityCount?: number; // Total number of activities for this concept
  };
}

/**
 * Complete graph data for Cytoscape
 */
export interface InterestGraphData {
  nodes: InterestGraphNode[];
  edges: InterestGraphEdge[];
}
