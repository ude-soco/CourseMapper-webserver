import { ConceptRecord, RelatedConceptInfo } from '../../types/user-pkg.types';

/**
 * Related concepts utility functions for showing/hiding related concepts in the graph
 * Uses the new aggregated relatedConcepts[] array from the backend
 * 
 * Handles the case where a related concept can be related to multiple main concepts.
 */

export function toggleRelatedConcepts(cy: any, conceptNode: any, rawConceptRecords: ConceptRecord[]): void {
  const clickedConceptId = conceptNode.id();
  
  const existingRelatedEdges = cy.edges(`[source="${clickedConceptId}"][label="related_to"]`);
  
  if (existingRelatedEdges.length > 0) {
    hideRelatedConcepts(cy, clickedConceptId);
  } else {
    showRelatedConcepts(cy, conceptNode, rawConceptRecords);
  }
}

function hideRelatedConcepts(cy: any, mainConceptId: string): void {
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

function showRelatedConcepts(cy: any, mainConceptNode: any, rawConceptRecords: ConceptRecord[]): void {
  const conceptData = mainConceptNode.data();
  const mainConceptId = mainConceptNode.id();
  
  // Get related concepts from the node's data (aggregated from backend)
  const relatedConcepts: RelatedConceptInfo[] = conceptData.relatedConcepts || [];
  
  // Filter to only show related concepts that exist in rawConceptRecords (respects TopN filter)
  const rawRecordCids = new Set(rawConceptRecords.map(r => r.cid));
  const validRelatedConcepts = relatedConcepts.filter(rc => 
    rc.cid && rc.name && rawRecordCids.has(rc.cid)
  );
  
  if (validRelatedConcepts.length === 0) {
    console.log('No related concepts in current records for:', conceptData.name);
    return;
  }

  const userNode = cy.nodes('[type="user"]')[0];
  const mainConceptPos = mainConceptNode.position();
  
  const radius = 280;
  const angleStep = (2 * Math.PI) / validRelatedConcepts.length;
  let angleOffset = 0;
  
  validRelatedConcepts.forEach((relatedConcept) => {
    const relatedNodeId = `concept-${relatedConcept.cid}`;
    
    // Find the related concept's full data from rawConceptRecords
    const relatedRecord = rawConceptRecords.find(r => r.cid === relatedConcept.cid);
    
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
          wikipedia: relatedRecord?.wikipedia,
          abstract: relatedRecord?.abstract,
          relationshipType: relatedRecord?.relationshipType || 'unknown',
        },
        position: {
          x: mainConceptPos.x + radius * Math.cos(angleOffset),
          y: mainConceptPos.y + radius * Math.sin(angleOffset)
        }
      });
      
      // Add edge from user to related concept (with understanding status)
      const edgeType = relatedRecord?.relationshipType || 'unknown';
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
          label: 'related_to'
        }
      });
    }
    
    angleOffset += angleStep;
  });
}

/**
 * Check if a concept has related concepts that exist in rawConceptRecords
 */
export function hasRelatedConceptsInData(conceptData: any, rawConceptRecords: ConceptRecord[]): boolean {
  const relatedConcepts: RelatedConceptInfo[] = conceptData.relatedConcepts || [];
  const rawRecordCids = new Set(rawConceptRecords.map(r => r.cid));
  return relatedConcepts.some(rc => rc.cid && rc.name && rawRecordCids.has(rc.cid));
}

/**
 * Check if related concepts are currently visible for a concept
 */
export function checkForRelatedConcepts(cy: any, conceptNode: any): boolean {
  const clickedConceptId = conceptNode.id();
  const relatedEdges = cy.edges(`[source="${clickedConceptId}"][label="related_to"]`);
  return relatedEdges.length > 0;
}
