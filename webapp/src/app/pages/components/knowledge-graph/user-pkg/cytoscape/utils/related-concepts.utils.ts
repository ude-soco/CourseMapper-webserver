import { RelatedConceptInfo, ViewMode } from '../../types/user-pkg.types';

/**
 * Related concepts utility functions for showing/hiding related concepts in the graph
 * Related concepts are fetched on-demand from the API.
 * 
 * Handles the case where a related concept can be related to multiple main concepts.
 * 
 * View Mode Behavior:
 * - Knowledge mode: User → Related Concept edges shown (with understanding status)
 * - Interest mode: NO User → Related Concept edges (only Main → Related)
 */

/**
 * Hide related concepts for a main concept
 */
export function hideRelatedConcepts(cy: any, mainConceptId: string): void {
  const relatedEdges = cy.edges(`[source="${mainConceptId}"][label="related_to"]`);
  
  relatedEdges.forEach((edge: any) => {
    const relatedNodeId = edge.data().target;
    const relatedNode = cy.getElementById(relatedNodeId);
    
    // Remove the relationship edge from this main concept
    edge.remove();
    
    if (relatedNode.length > 0) {
      // Check if this related concept has other "related_to" edges from other main concepts
      const otherRelatedEdges = cy.edges(`[target="${relatedNodeId}"][label="related_to"]`);
      
      // Only remove the node if no other main concepts are showing it
      if (otherRelatedEdges.length === 0) {
        // Remove user edge to related concept
        const userEdges = cy.edges(`[target="${relatedNodeId}"]`);
        userEdges.remove();
        
        // Remove related concept node
        relatedNode.remove();
      }
    }
  });
}

/**
 * Show related concepts for a main concept (fetched on-demand from API)
 * 
 * @param cy - Cytoscape instance
 * @param mainConceptNode - The main concept node to show related concepts for
 * @param relatedConcepts - Array of related concepts from API
 * @param viewMode - Current view mode (affects whether user-to-related edges are shown)
 */
export function showRelatedConcepts(
  cy: any, 
  mainConceptNode: any, 
  relatedConcepts: RelatedConceptInfo[],
  viewMode: ViewMode = 'knowledge'
): void {
  const mainConceptId = mainConceptNode.id();
  
  // Filter to valid related concepts that are NOT "new" (unknown)
  // Only show concepts that have been marked as understood or not understood
  const validRelatedConcepts = relatedConcepts.filter(rc => 
    rc.cid && rc.name && (rc.relationshipType === 'u' || rc.relationshipType === 'dnu')
  );
  
  if (validRelatedConcepts.length === 0) {
    console.log('No related concepts to show (all are new/unknown)');
    return;
  }

  const userNode = cy.nodes('[type="user"]')[0];
  const mainConceptPos = mainConceptNode.position();
  
  const radius = 280;
  const angleStep = (2 * Math.PI) / validRelatedConcepts.length;
  let angleOffset = 0;
  
  validRelatedConcepts.forEach((relatedConcept) => {
    const relatedNodeId = `concept-${relatedConcept.cid}`;
    
    // Check if node already exists (might be shown by another main concept)
    const existingNode = cy.getElementById(relatedNodeId);
    
    if (existingNode.length === 0) {
      // Add related concept node only if it doesn't exist
      cy.add({
        group: 'nodes',
        data: {
          id: relatedNodeId,
          name: relatedConcept.name,
          type: 'related_concept',
          cid: relatedConcept.cid,
          wikipedia: relatedConcept.wikipedia,
          abstract: relatedConcept.abstract,
          relationshipType: relatedConcept.relationshipType || 'unknown',
        },
        position: {
          x: mainConceptPos.x + radius * Math.cos(angleOffset),
          y: mainConceptPos.y + radius * Math.sin(angleOffset)
        }
      });
      
      // Only add edge from user to related concept in KNOWLEDGE mode
      // In Interest mode, related concepts are only connected to main concepts
      if (viewMode === 'knowledge') {
        const edgeType = relatedConcept.relationshipType || 'unknown';
        const edgeLabel = edgeType === 'u' ? 'Understood' : edgeType === 'dnu' ? 'Not Understood' : '';
        cy.add({
          group: 'edges',
          data: {
            id: `edge-user-${relatedNodeId}`,
            source: userNode.id(),
            target: relatedNodeId,
            type: edgeType,
            label: edgeLabel
          }
        });
      }
    }
    
    // Always add the relationship edge from this main concept to the related concept
    // Use a unique ID that includes both source and target
    const relationEdgeId = `edge-${mainConceptId}-${relatedNodeId}`;
    const existingRelationEdge = cy.getElementById(relationEdgeId);
    
    if (existingRelationEdge.length === 0) {
      cy.add({
        group: 'edges',
        data: {
          id: relationEdgeId,
          source: mainConceptId,
          target: relatedNodeId,
          label: 'related_to',
          type: 'related_to'
        }
      });
    }
    
    angleOffset += angleStep;
  });
}

/**
 * Check if related concepts are currently visible for a concept
 */
export function checkForRelatedConcepts(cy: any, conceptNode: any): boolean {
  const clickedConceptId = conceptNode.id();
  const relatedEdges = cy.edges(`[source="${clickedConceptId}"][label="related_to"]`);
  return relatedEdges.length > 0;
}
