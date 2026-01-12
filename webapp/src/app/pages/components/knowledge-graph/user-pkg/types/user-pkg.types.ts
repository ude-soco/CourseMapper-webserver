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
  wikipedia?: string | null;
  abstract?: string | null;
  relationshipType?: 'u' | 'dnu' | 'unknown' | null;
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
  relationshipType: 'u' | 'dnu' | 'unknown';
  materialId?: string;
  materialName?: string;
  materialType?: string;
  courseId?: string;
  courseName?: string;
  courseShortName?: string;
  channelId?: string;
  // Interest score
  interestScore?: number;
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
  channelId: string;
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
  courseId?: string;
  courseName?: string;
  courseShortName?: string;
  allCourseIds?: string[];
  initials?: string;
  // Interest score for interest view mode
  interestScore?: number;
  // Engagement level for engagement view mode (courses only)
  engagementLevel?: string;
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
  // Interest score for interest view mode
  interestScore?: number;
  interestScoreUpdatedAt?: string;
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

// Advanced filters for courses, materials, slides
export interface AdvancedFilters {
  selectedCourseIds: string[];
  selectedMaterialIds: string[];
  selectedSlideIds: string[];
}

// Filter state (used by reducer and filter controls component)
export interface PkgFilters {
  viewMode: ViewMode;
  searchQuery: string;
  topNConcepts: number | 'All';
  understandingStatus: 'all' | 'u' | 'dnu';
  advancedFilters: AdvancedFilters | null;
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
  channelId?: string;
  relationshipType?: 'u' | 'dnu';
}

// Interest score data structure
export interface InterestScoreInfo {
  score: number;
  updatedAt: string;
}

// Interest scores response from API
export interface InterestScoresResponse {
  userId: string;
  scores: { [conceptId: string]: InterestScoreInfo };
  totalConcepts: number;
}

// ===========================
// Concept Details Panel Types
// ===========================

/**
 * Concept data passed to concept details panel
 */
export interface ConceptData {
  name: string;
  type?: string;
  abstract?: string;
  wikipedia?: string;
  interestScore?: number;
  [key: string]: any;
}

/**
 * Slide node for concept details tree
 */
export interface SlideNode {
  slideId?: string;
  slideName: string;
  detail: ConceptDetail;
}

/**
 * Material node for concept details tree
 */
export interface MaterialNode {
  materialId: string;
  materialName: string;
  materialType?: string;
  slides: SlideNode[];
}

/**
 * Course node for concept details tree
 */
export interface CourseNode {
  courseId: string;
  courseName: string;
  courseShortName?: string;
  materials: MaterialNode[];
}

// ===========================
// Course Details Panel Types
// ===========================

/**
 * Course node data passed to course details panel
 */
export interface CourseNodeData {
  id: string;
  courseId: string;
  name: string;
  courseName?: string;
  courseShortName?: string;
  engagementLevel?: string;
  type?: string;
  [key: string]: any;
}

/**
 * Detailed course information
 */
export interface CourseDetails {
  _id: string;
  name: string;
  shortName?: string;
  description?: string;
  role?: string;
  numberOfTopics?: number;
  numberOfChannels?: number;
  createdAt?: string;
  updatedAt?: string;
}

