/**
 * types for User Personal Knowledge Graph 
 */

// View modes for the knowledge graph
export type ViewMode = 'knowledge' | 'interest' | 'engagement';

// Slide info from aggregated query
export interface SlideInfo {
  sid: string | null;
  name: string | null;
}

// Related concept info from aggregated query
export interface RelatedConceptInfo {
  cid: string | null;
  name: string | null;
}

// Raw concept record from backend API
export interface ConceptRecord {
  cid: string;
  name: string;
  type: string;
  wikipedia?: string;
  abstract?: string;
  weight: number;
  mid?: string;
  slides: SlideInfo[];
  relatedConcepts: RelatedConceptInfo[];
  relationshipType: 'u' | 'dnu' | 'unknown';
  materialId?: string;
  materialName?: string;
  materialType?: string;
  courseId?: string;
  courseName?: string;
  courseShortName?: string;
}

// Course info from backend
export interface CourseInfo {
  courseId: string;
  courseName: string;
  courseShortName: string;
  engagementLevel?: string; // 'low', 'medium', 'high'
}

// Material info from backend
export interface MaterialInfo {
  materialId: string;
  materialName: string;
  materialType: string;
  courseId: string;
  courseName: string;
  courseShortName: string;
}

// API response structure
export interface UserPkgResponse {
  records: ConceptRecord[];
  courses: CourseInfo[];
  materials: MaterialInfo[];
}

// Cytoscape node data
export interface CytoscapeNodeData {
  id: string;
  name: string;
  type: 'user' | 'main_concept' | 'related_concept' | 'course';
  cid?: string;
  uid?: string;
  wikipedia?: string;
  abstract?: string;
  weight?: number;
  relationshipType?: 'u' | 'dnu' | 'unknown';
  slides?: SlideInfo[];
  relatedConcepts?: RelatedConceptInfo[];
  courseId?: string;
  courseName?: string;
  courseShortName?: string;
  allCourseIds?: string[];
  initials?: string;
  engagementLevel?: string; // For course nodes in engagement view
}

export interface CytoscapeNode {
  data: CytoscapeNodeData;
}

// Cytoscape edge data
export interface CytoscapeEdgeData {
  id: string;
  source: string;
  target: string;
  type?: string;
  label?: string;
  engagementLevel?: string; // For edges connecting user to courses
}

export interface CytoscapeEdge {
  data: CytoscapeEdgeData;
}

// Graph data structure for Cytoscape
export interface UserPkgGraphData {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
}

// Filter state (used by reducer and filter controls component)
export interface PkgFilters {
  viewMode: ViewMode;
  searchQuery: string;
  topNConcepts: number | 'All';
  understandingStatus: 'all' | 'u' | 'dnu';
}

// Concept detail for the details panel
export interface ConceptDetail {
  slideId?: string;
  slideName: string;
  materialId: string;
  materialName: string;
  materialType?: string;
  courseId?: string;
  courseName: string;
  courseShortName?: string;
  relationshipType?: 'u' | 'dnu';
}
