import { InterestConcept } from '../../types/interest-level.types';

/**
 * Tooltip state for graph edge hover
 */
export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  text: string;
  conceptId: string;
  conceptName: string;
  conceptIds: string[]; // All concept IDs with same name (for duplicates)
  originalScore: number;
  isHovered: boolean;
}

/**
 * Score editing state when user adjusts interest scores
 */
export interface ScoreEditState {
  conceptId: string | null;
  conceptName: string | null;
  conceptIds: string[]; // Multiple IDs if concept has duplicates
  originalScore: number;
  adjustedScore: number;
  hasChanged: boolean;
  canEdit: boolean;
  isUpdating: boolean;
}

/**
 * Graph layout state for cytoscape visualization
 */
export interface GraphState {
  nodePositions: { [nodeId: string]: { x: number; y: number } } | null;
  lastLayout: 'cose' | 'preset' | 'circle' | 'grid';
  zoom: number;
  pan: { x: number; y: number };
  lastEditedConceptId: string | null;
}

/**
 * Selected concept for details panel
 */
export interface SelectedConcept {
  id: string;
  name: string;
  cid: string;
  type: 'main_concept' | 'related_concept';
  wikipedia?: string;
  abstract?: string;
  interestScore?: number;
}

/**
 * Panel visibility state
 */
export interface PanelVisibility {
  conceptDetailsVisible: boolean;
  courseDetailsVisible: boolean;
  helpDialogVisible: boolean;
}

/**
 * Legend visibility state (dynamic based on graph content)
 */
export interface LegendVisibility {
  user: boolean;
  mainConcept: boolean;
  relatedConcept: boolean;
  understood: boolean;
  notUnderstood: boolean;
  unknown: boolean;
  course: boolean;
}

/**
 * Complete PKG Interest Level state slice
 */
export interface PkgInterestState {
  // Data state
  concepts: InterestConcept[];
  loading: boolean;
  loaded: boolean;
  error: string | null;
  
  // Filter state
  topN: number | 'All';
  searchTerm: string;
  
  // UI state
  tooltip: TooltipState;
  scoreEdit: ScoreEditState;
  graph: GraphState;
  selectedConcept: SelectedConcept | null;
  panels: PanelVisibility;
  legends: LegendVisibility;
  returnViewMode: 'interest' | 'engagement' | 'knowledge' | null;
}

/**
 * Initial tooltip state
 */
export const initialTooltipState: TooltipState = {
  visible: false,
  x: 0,
  y: 0,
  text: '',
  conceptId: '',
  conceptName: '',
  conceptIds: [],
  originalScore: 0,
  isHovered: false
};

/**
 * Initial score edit state
 */
export const initialScoreEditState: ScoreEditState = {
  conceptId: null,
  conceptName: null,
  conceptIds: [],
  originalScore: 0,
  adjustedScore: 0,
  hasChanged: false,
  canEdit: false,
  isUpdating: false
};

/**
 * Initial graph state
 */
export const initialGraphState: GraphState = {
  nodePositions: null,
  lastLayout: 'cose',
  zoom: 1,
  pan: { x: 0, y: 0 },
  lastEditedConceptId: null
};

/**
 * Initial panel visibility state
 */
export const initialPanelVisibility: PanelVisibility = {
  conceptDetailsVisible: false,
  courseDetailsVisible: false,
  helpDialogVisible: false
};

/**
 * Initial legend visibility state
 */
export const initialLegendVisibility: LegendVisibility = {
  user: true,
  mainConcept: false,
  relatedConcept: false,
  understood: false,
  notUnderstood: false,
  unknown: false,
  course: false
};
