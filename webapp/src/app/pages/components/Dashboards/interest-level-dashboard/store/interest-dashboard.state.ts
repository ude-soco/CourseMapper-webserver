/**
 * State interfaces for Interest Level Dashboard
 */

export interface ActivityBreakdown {
  activity_id: string;
  activity_name: string;
  count: number;
  weight: number;
  contribution: number;
  group_id?: string;
  group_name?: string;
}

export interface ConceptInterestData {
  concept_ids: string[];
  raw_score: number;
  normalized_scores: {
    min_max_interpolation: number;
    z_score_k2: number;
    z_score_k3: number;
  };
  activities_breakdown: ActivityBreakdown[];
  total_activity_count: number;
  course_id: string;
  course_name: string;
}

export interface ActivityCategoryGroup {
  categoryName: string;
  categoryKey: string;
  activities: ActivityBreakdown[];
  totalCount: number;
  totalContribution: number;
  expanded: boolean;
  visible: boolean;
  showTextView?: boolean;
}

export interface TopConcept {
  name: string;
  score: number;
  course: string;
}

export interface ChartData {
  labels: string[];
  datasets: any[];
}

export interface ChartOptions {
  responsive: boolean;
  maintainAspectRatio: boolean;
  [key: string]: any;
}

export interface DashboardChartState {
  gauge: {
    data: ChartData | null;
    options: ChartOptions | null;
  };
  totalActivities: {
    data: ChartData | null;
    options: ChartOptions | null;
  };
  topConcepts: {
    data: ChartData | null;
    options: ChartOptions | null;
  };
  categories: {
    [categoryKey: string]: {
      data: ChartData | null;
      options: ChartOptions | null;
    };
  };
}

/**
 * Complete Interest Level Dashboard state slice
 */
export interface InterestDashboardState {
  // Route params
  conceptName: string;
  conceptId: string;
  
  // Data state
  conceptData: ConceptInterestData | null;
  activityCategories: ActivityCategoryGroup[];
  topConcepts: TopConcept[];
  loading: boolean;
  loadingTopConcepts: boolean;
  error: string | null;
  
  // Chart state
  charts: DashboardChartState;
  
  // UI state
  activeTabIndex: number;
  topConceptsLimit: number | 'All';
  returnViewMode: 'interest' | 'engagement' | 'knowledge' | null;
}

/**
 * Initial chart state
 */
export const initialChartState: DashboardChartState = {
  gauge: {
    data: null,
    options: null
  },
  totalActivities: {
    data: null,
    options: null
  },
  topConcepts: {
    data: null,
    options: null
  },
  categories: {}
};

/**
 * Initial dashboard state
 */
export const initialInterestDashboardState: InterestDashboardState = {
  conceptName: '',
  conceptId: '',
  conceptData: null,
  activityCategories: [],
  topConcepts: [],
  loading: false,
  loadingTopConcepts: false,
  error: null,
  charts: initialChartState,
  activeTabIndex: 0,
  topConceptsLimit: 5,
  returnViewMode: null
};
