import { ConceptRecord } from '../../types/user-pkg.types';

/**
 * Course node utility functions for toggling course visibility in the graph
 */

export function toggleCourseNode(cy: any, conceptNode: any, rawConceptRecords: ConceptRecord[]): void {
  const conceptData = conceptNode.data();
  const conceptName = conceptData.name.toLowerCase().trim();
  const clickedConceptId = conceptNode.id();
  
  const coursesForConcept = findCoursesForConcept(conceptName, conceptData, rawConceptRecords);
  
  if (coursesForConcept.courses.size === 0) {
    console.log('No course information found for concept:', conceptData.name);
    return;
  }
  
  const userNode = cy.nodes('[type="user"]')[0];
  const hasExistingEdges = hasExistingCourseEdges(cy, clickedConceptId, coursesForConcept.courses);
  
  if (hasExistingEdges) {
    hideCourseNodes(cy, clickedConceptId, coursesForConcept.courses);
  } else {
    showCourseNodes(cy, conceptNode, userNode, coursesForConcept);
  }
}

function findCoursesForConcept(conceptName: string, conceptData: any, rawConceptRecords: ConceptRecord[]): any {
  const coursesForConcept = new Set<string>();
  const courseDetails = new Map<string, any>();
  
  if (rawConceptRecords && rawConceptRecords.length > 0) {
    rawConceptRecords.forEach(record => {
      if (record.name.toLowerCase().trim() === conceptName) {
        const courseId = record.courseId;
        const courseName = record.courseName || record.courseShortName;
        if (courseId && courseName) {
          coursesForConcept.add(courseId);
          courseDetails.set(courseId, {
            id: courseId,
            name: courseName
          });
        }
      }
    });
  }
  
  // Fallback to node data
  if (coursesForConcept.size === 0 && conceptData.courseId) {
    coursesForConcept.add(conceptData.courseId);
    courseDetails.set(conceptData.courseId, {
      id: conceptData.courseId,
      name: conceptData.courseName || conceptData.courseShortName
    });
  }
  
  return { courses: coursesForConcept, details: courseDetails };
}

function hasExistingCourseEdges(cy: any, conceptId: string, courses: Set<string>): boolean {
  const existingEdges = Array.from(courses)
    .map(courseId => cy.getElementById(`edge-course-${courseId}-${conceptId}`))
    .filter(edge => edge.length > 0);
  
  return existingEdges.length > 0;
}

function hideCourseNodes(cy: any, conceptId: string, courses: Set<string>): void {
  courses.forEach(courseId => {
    const courseNodeId = `course-${courseId}`;
    const edgeToThisConcept = cy.getElementById(`edge-${courseNodeId}-${conceptId}`);
    
    if (edgeToThisConcept.length > 0) {
      edgeToThisConcept.remove();
      
      const courseNode = cy.getElementById(courseNodeId);
      if (courseNode.length > 0) {
        const remainingEdges = cy.edges(`[source="${courseNodeId}"]`);
        if (remainingEdges.length === 0) {
          const userEdge = cy.edges(`[target="${courseNodeId}"]`);
          userEdge.remove();
          courseNode.remove();
        }
      }
    }
  });
}

function showCourseNodes(cy: any, conceptNode: any, userNode: any, coursesData: any): void {
  const conceptPos = conceptNode.position();
  const clickedConceptId = conceptNode.id();
  
  const radius = 180; // Different radius than related concepts (280)
  const angleStep = (2 * Math.PI) / coursesData.courses.size;
  let angleOffset = 0;
  
  coursesData.courses.forEach((courseId: string) => {
    const course = coursesData.details.get(courseId);
    const courseNodeId = `course-${courseId}`;
    
    let existingCourse = cy.getElementById(courseNodeId);
    
    if (existingCourse.length === 0) {
      // Position around the concept node (like related concepts)
      cy.add({
        group: 'nodes',
        data: {
          id: courseNodeId,
          name: course.name,
          type: 'course',
          courseId: courseId
        },
        position: {
          x: conceptPos.x + radius * Math.cos(angleOffset),
          y: conceptPos.y + radius * Math.sin(angleOffset)
        }
      });
      
      cy.add({
        group: 'edges',
        data: {
          id: `edge-user-${courseNodeId}`,
          source: userNode.id(),
          target: courseNodeId,
          type: 'course-relation',
          label: 'Enrolled In'
        }
      });
      
      existingCourse = cy.getElementById(courseNodeId);
    }
    
    const edgeId = `edge-${courseNodeId}-${clickedConceptId}`;
    const existingEdge = cy.getElementById(edgeId);
    
    if (existingEdge.length === 0) {
      cy.add({
        group: 'edges',
        data: {
          id: edgeId,
          source: courseNodeId,
          target: clickedConceptId,
          label: 'Has_Concept'
        }
      });
    }
    
    angleOffset += angleStep;
  });
}

export function hasCourseConnection(cy: any, conceptNode: any, rawConceptRecords: ConceptRecord[]): boolean {
  const conceptData = conceptNode.data();
  const clickedConceptId = conceptNode.id();
  const conceptName = conceptData.name.toLowerCase().trim();
  
  let hasAnyCourseConnection = false;
  
  if (rawConceptRecords && rawConceptRecords.length > 0) {
    rawConceptRecords.forEach(record => {
      if (record.name.toLowerCase().trim() === conceptName) {
        const courseId = record.courseId;
        const courseNodeId = `course-${courseId}`;
        const edgeId = `edge-${courseNodeId}-${clickedConceptId}`;
        const edgeExists = cy.getElementById(edgeId).length > 0;
        if (edgeExists) {
          hasAnyCourseConnection = true;
        }
      }
    });
  } else if (conceptData.courseId) {
    const courseNodeId = `course-${conceptData.courseId}`;
    const edgeId = `edge-${courseNodeId}-${clickedConceptId}`;
    hasAnyCourseConnection = cy.getElementById(edgeId).length > 0;
  }
  
  return hasAnyCourseConnection;
}
