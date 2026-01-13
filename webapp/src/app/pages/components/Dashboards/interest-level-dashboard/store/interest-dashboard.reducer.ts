/**
 * INTEREST DASHBOARD REDUCER
 * 
 * NgRx reducer for the Interest Level Dashboard feature. Manages state updates in response to
 * dispatched actions, following the immutable state update pattern required by NgRx.
 * 
 * THESIS CONTEXT - STATE MANAGEMENT:
 * This reducer is the single source of truth for all Interest Level Dashboard state. It ensures
 * predictable state updates and enables features like time-travel debugging, state persistence,
 * and undo/redo functionality (though we don't currently use these advanced features).
 * 
 * REDUCER PATTERN:
 * Each `on()` handler specifies:
 * 1. Which action(s) to respond to
 * 2. How to transform the current state into the next state
 * 3. State is NEVER mutated - always return new object with spread operator
 * 
 * STATE ORGANIZATION:
 * The reducer manages several categories of state:
 * - Route params: conceptName, conceptId (from URL query params)
 * - API data: conceptData (interest score + activities), topConcepts (comparison data)
 * - UI state: loading flags, error messages, active tab, filter settings
 * - Activity categories: grouped activities with expand/collapse/visibility state
 * - Chart configs: data and options for all chart types
 * 
 * IMMUTABILITY PATTERNS:
 * - Top-level: {...state, newProp: value}
 * - Nested object: {...state, nested: {...state.nested, prop: value}}
 * - Array map: state.array.map(item => condition ? {...item, prop: newValue} : item)
 * - Full reset: Return initialInterestDashboardState (for clearDashboard action)
 * 
 * WHY IMMUTABILITY MATTERS:
 * - Enables change detection: Angular can detect state changes by reference equality
 * - Supports time-travel debugging: Each state is preserved as a snapshot
 * - Prevents bugs: Can't accidentally mutate state from component code
 * - Aligns with NgRx best practices and Redux pattern
 * 
 * @module InterestDashboardReducer
 */

import { createFeatureSelector, createReducer, createSelector, on } from '@ngrx/store';
import * as InterestDashboardActions from './interest-dashboard.actions';
import {
  InterestDashboardState,
  initialInterestDashboardState,
  ActivityCategoryGroup
} from './interest-dashboard.state';

export const interestDashboardFeatureKey = 'interestDashboard';

/**
 * Interest Dashboard Reducer
 * 
 * Handles all state transitions for the Interest Level Dashboard feature.
 * See action handlers below for specific state update logic.
 */
export const interestDashboardReducer = createReducer(
  initialInterestDashboardState,
  
  // ===========================
  // Route & Initialization
  // ===========================
  
  /**
   * ACTION: setConceptParams
   * TRIGGER: Component ngOnInit() when route params are read
   * PURPOSE: Store concept name and ID from URL query params in state
   * 
   * This enables other parts of the app to access current concept info without
   * directly reading route params. Used for:
   * - API calls (need conceptName for requests)
   * - Chart labels (display conceptName in chart titles)
   * - Navigation (need conceptId for routing back to concept details)
   * 
   * STATE UPDATE:
   * - Shallow merge: {...state, conceptName, conceptId}
   * - Only updates these two fields, preserves all other state
   */
  on(InterestDashboardActions.setConceptParams, (state, { conceptName, conceptId }) => ({
    ...state,
    conceptName,
    conceptId
  })),
  
  // ===========================
  // Load Concept Data
  // ===========================
  
  /**
   * ACTION: loadConceptData (REQUEST)
   * TRIGGER: Component initialization or manual refresh
   * PURPOSE: Mark start of API call to fetch concept interest data
   * 
   * Sets loading=true to show spinner/skeleton UI while data is being fetched.
   * Clears any previous error to reset error state from previous failed attempts.
   * 
   * STATE UPDATE:
   * - loading: false → true (show loading indicator)
   * - error: <any> → null (reset error state)
   */
  on(InterestDashboardActions.loadConceptData, (state) => ({
    ...state,
    loading: true,
    error: null
  })),
  
  /**
   * ACTION: loadConceptDataSuccess (SUCCESS)
   * TRIGGER: Effect receives successful API response with ConceptInterestData
   * PURPOSE: Store fetched concept data and mark loading complete
   * 
   * This data contains:
   * - normalized_scores: { min_max_interpolation: 0.75, ... }
   * - activities_breakdown: [{ activity_id, activity_name, count, weight, contribution }, ...]
   * - raw_score: sum of weighted activity counts
   * 
   * Component subscriptions will detect this state change and trigger:
   * - Activity category grouping (initializeActivityCategories)
   * - Gauge chart initialization (initializeGaugeChart)
   * - Category charts initialization (initializeCategoryCharts)
   * 
   * STATE UPDATE:
   * - conceptData: null → ConceptInterestData object
   * - loading: true → false (hide loading indicator)
   * - error: <any> → null (ensure error is cleared)
   */
  on(InterestDashboardActions.loadConceptDataSuccess, (state, { data }) => ({
    ...state,
    conceptData: data,
    loading: false,
    error: null
  })),
  
  /**
   * ACTION: loadConceptDataFailure (FAILURE)
   * TRIGGER: Effect receives error from API call (network error, 404, 500, etc.)
   * PURPOSE: Store error message and mark loading complete
   * 
   * Error is displayed to user via:
   * - PrimeNG toast notification (handled by showErrorMessage effect)
   * - Optional error message in UI (can check state.error in component)
   * 
   * STATE UPDATE:
   * - loading: true → false (hide loading indicator even on error)
   * - error: null → error message string
   */
  on(InterestDashboardActions.loadConceptDataFailure, (state, { error }) => ({
    ...state,
    loading: false,
    error
  })),
  
  // ===========================
  // Load Top Concepts
  // ===========================
  
  on(InterestDashboardActions.loadTopConcepts, (state) => ({
    ...state,
    loadingTopConcepts: true
  })),
  
  on(InterestDashboardActions.loadTopConceptsSuccess, (state, { concepts }) => ({
    ...state,
    topConcepts: concepts,
    loadingTopConcepts: false
  })),
  
  on(InterestDashboardActions.loadTopConceptsFailure, (state, { error }) => ({
    ...state,
    loadingTopConcepts: false,
    error
  })),
  
  // ===========================
  // Activity Categories
  // ===========================
  
  on(InterestDashboardActions.setActivityCategories, (state, { categories }) => ({
    ...state,
    activityCategories: categories
  })),
  
  /**
   * ACTION: toggleCategoryExpand
   * TRIGGER: User clicks category header to expand/collapse details
   * PURPOSE: Toggle the 'expanded' flag for a specific category
   * 
   * IMMUTABILITY PATTERN - ARRAY MAP:
   * Cannot directly mutate: state.activityCategories[i].expanded = !expanded (FORBIDDEN in NgRx)
   * Must create new array with new objects:
   * 1. Map over array
   * 2. For matching item: return new object with updated property
   * 3. For other items: return unchanged
   * 
   * This creates a new array reference and new object reference for the modified category,
   * triggering Angular change detection.
   * 
   * THESIS CONTEXT:
   * Supports progressive disclosure - users can expand only the categories they're interested in,
   * avoiding information overload.
   * 
   * STATE UPDATE:
   * - activityCategories: New array with one modified category object
   * - Modified category: {...cat, expanded: !cat.expanded}
   */
  on(InterestDashboardActions.toggleCategoryExpand, (state, { categoryKey }) => ({
    ...state,
    activityCategories: state.activityCategories.map(cat =>
      cat.categoryKey === categoryKey
        ? { ...cat, expanded: !cat.expanded }
        : cat
    )
  })),
  
  on(InterestDashboardActions.toggleCategoryView, (state, { categoryKey }) => ({
    ...state,
    activityCategories: state.activityCategories.map(cat =>
      cat.categoryKey === categoryKey
        ? { ...cat, showTextView: !cat.showTextView }
        : cat
    )
  })),
  
  on(InterestDashboardActions.toggleCategoryVisibility, (state, { categoryKey }) => ({
    ...state,
    activityCategories: state.activityCategories.map(cat =>
      cat.categoryKey === categoryKey
        ? { ...cat, visible: !cat.visible }
        : cat
    )
  })),
  
  // ===========================
  // Charts
  // ===========================
  
  on(InterestDashboardActions.setGaugeChart, (state, { data, options }) => ({
    ...state,
    charts: {
      ...state.charts,
      gauge: { data, options }
    }
  })),
  
  on(InterestDashboardActions.setTotalActivitiesChart, (state, { data, options }) => ({
    ...state,
    charts: {
      ...state.charts,
      totalActivities: { data, options }
    }
  })),
  
  on(InterestDashboardActions.setTopConceptsChart, (state, { data, options }) => ({
    ...state,
    charts: {
      ...state.charts,
      topConcepts: { data, options }
    }
  })),
  
  /**
   * ACTION: setCategoryChart
   * TRIGGER: Component finishes initializing a chart for a specific activity category
   * PURPOSE: Store chart data and options for a category in the nested charts.categories object
   * 
   * IMMUTABILITY PATTERN - NESTED OBJECT:
   * Must create new objects at every level of nesting:
   * 1. New state object: {...state, ...}
   * 2. New charts object: {...state.charts, ...}
   * 3. New categories object: {...state.charts.categories, ...}
   * 4. New entry for this category: [categoryKey]: { data, options }
   * 
   * Why this matters:
   * - Angular detects changes by object reference
   * - NgRx enforces immutability with Object.freeze() in dev mode
   * - Selectors rely on reference equality for memoization
   * 
   * THESIS CONTEXT:
   * Each activity category (kg, recommendation, annotation, material, access) gets its own
   * chart. This handler stores the Chart.js configuration for each one, keyed by categoryKey.
   * 
   * STATE UPDATE:
   * - charts.categories[categoryKey]: undefined → { data, options }
   * - All parent objects (state, charts, categories) are new references
   */
  on(InterestDashboardActions.setCategoryChart, (state, { categoryKey, data, options }) => ({
    ...state,
    charts: {
      ...state.charts,
      categories: {
        ...state.charts.categories,
        [categoryKey]: { data, options }
      }
    }
  })),
  
  // ===========================
  // UI State
  // ===========================
  
  on(InterestDashboardActions.setActiveTab, (state, { tabIndex }) => ({
    ...state,
    activeTabIndex: tabIndex
  })),
  
  on(InterestDashboardActions.setTopConceptsLimit, (state, { limit }) => ({
    ...state,
    topConceptsLimit: limit
  })),
  
  on(InterestDashboardActions.setReturnViewMode, (state, { viewMode }) => ({
    ...state,
    returnViewMode: viewMode
  })),
  
  on(InterestDashboardActions.clearReturnViewMode, (state) => ({
    ...state,
    returnViewMode: null
  })),
  
  // ===========================
  // Clear State
  // ===========================
  
  /**
   * ACTION: clearDashboard
   * TRIGGER: Component ngOnDestroy() lifecycle hook
   * PURPOSE: Reset all dashboard state to initial values
   * 
   * WHY CLEAR STATE?
   * When user navigates away from Interest Level Dashboard, we reset state to:
   * - Prevent stale data appearing when user navigates to a different concept
   * - Free memory (activityCategories can contain hundreds of activity records)
   * - Reset UI state (active tab, filter settings, expanded categories)
   * 
   * PATTERN:
   * Simply return initialInterestDashboardState - no spread operator needed.
   * This is the cleanest way to reset all state at once.
   * 
   * THESIS CONTEXT:
   * Proper state cleanup prevents bugs where old concept's data briefly appears
   * when loading a new concept, improving user experience.
   * 
   * STATE UPDATE:
   * - ALL state: <current values> → initial values
   * - conceptData: <data> → null
   * - activityCategories: [...] → []
   * - charts: {...} → initial empty structure
   * - loading: false → false
   * - error: <any> → null
   */
  on(InterestDashboardActions.clearDashboard, () => initialInterestDashboardState)
);

// ===========================
// Feature Selector
// ===========================

/**
 * FEATURE SELECTOR: Access Interest Dashboard slice of NgRx store
 * 
 * Creates a selector that retrieves the 'interestDashboard' feature state from the root state.
 * This is the entry point for all Interest Dashboard selectors.
 * 
 * THESIS CONTEXT - MODULAR STATE:
 * NgRx organizes state into feature slices. The Interest Dashboard feature has its own slice,
 * independent from other features (PKG Interest, User Engagement, etc.). This modularity:
 * - Prevents naming conflicts (each feature manages its own state)
 * - Enables lazy loading (feature state loaded only when feature module loads)
 * - Improves maintainability (changes to one feature don't affect others)
 * 
 * USAGE:
 * Other selectors compose with this one:
 * selectConceptData = createSelector(selectInterestDashboardState, state => state.conceptData)
 */
const selectInterestDashboardState = createFeatureSelector<InterestDashboardState>(
  interestDashboardFeatureKey
);

// ===========================
// Basic Selectors
// ===========================

/**
 * SELECTORS: Direct property access from state
 * 
 * These selectors extract specific properties from the Interest Dashboard state.
 * They are "basic" selectors because they don't perform any computation - just property access.
 * 
 * MEMOIZATION:
 * NgRx createSelector() provides automatic memoization. If the input state hasn't changed
 * (by reference equality), the selector returns the cached result without re-executing.
 * This is critical for performance - prevents unnecessary re-renders in components.
 * 
 * THESIS CONTEXT - REACTIVE DATA FLOW:
 * Components subscribe to these selectors using store.select(). When state updates:
 * 1. Reducer creates new state object
 * 2. Selectors detect change (reference inequality)
 * 3. Selectors re-compute and emit new values
 * 4. Component subscriptions receive new values
 * 5. Angular change detection updates view
 * 
 * This reactive pattern is the foundation of the NgRx architecture.
 */

/** SELECT: conceptName - Current concept name from URL query params */
export const selectConceptName = createSelector(
  selectInterestDashboardState,
  (state) => state.conceptName
);

/** SELECT: conceptId - Current concept ID from URL query params */
export const selectConceptId = createSelector(
  selectInterestDashboardState,
  (state) => state.conceptId
);

/** SELECT: conceptData - Full ConceptInterestData object with scores and activities */
export const selectConceptData = createSelector(
  selectInterestDashboardState,
  (state) => state.conceptData
);

/** SELECT: activityCategories - Grouped and categorized user activities */
export const selectActivityCategories = createSelector(
  selectInterestDashboardState,
  (state) => state.activityCategories
);

/** SELECT: topConcepts - Top N concepts for comparison chart */
export const selectTopConcepts = createSelector(
  selectInterestDashboardState,
  (state) => state.topConcepts
);

/** SELECT: loading - Loading state for main concept data */
export const selectLoading = createSelector(
  selectInterestDashboardState,
  (state) => state.loading
);

/** SELECT: loadingTopConcepts - Loading state for top concepts data */
export const selectLoadingTopConcepts = createSelector(
  selectInterestDashboardState,
  (state) => state.loadingTopConcepts
);

/** SELECT: error - Error message from failed API calls */
export const selectError = createSelector(
  selectInterestDashboardState,
  (state) => state.error
);

/** SELECT: charts - Root charts object containing all chart configs */
export const selectCharts = createSelector(
  selectInterestDashboardState,
  (state) => state.charts
);

/** SELECT: gaugeChart - Interest score gauge chart config */
export const selectGaugeChart = createSelector(
  selectCharts,
  (charts) => charts.gauge
);

/** SELECT: totalActivitiesChart - Category distribution bar chart config */
export const selectTotalActivitiesChart = createSelector(
  selectCharts,
  (charts) => charts.totalActivities
);

/** SELECT: topConceptsChart - Concepts comparison bar chart config */
export const selectTopConceptsChart = createSelector(
  selectCharts,
  (charts) => charts.topConcepts
);

/** SELECT: categoryCharts - All category-specific chart configs */
export const selectCategoryCharts = createSelector(
  selectCharts,
  (charts) => charts.categories
);

/** SELECT: activeTabIndex - Currently selected tab (0 or 1) */
export const selectActiveTabIndex = createSelector(
  selectInterestDashboardState,
  (state) => state.activeTabIndex
);

/** SELECT: topConceptsLimit - Number of top concepts to display */
export const selectTopConceptsLimit = createSelector(
  selectInterestDashboardState,
  (state) => state.topConceptsLimit
);

/** SELECT: returnViewMode - PKG Interest return view ('interest' or 'graph') */
export const selectReturnViewMode = createSelector(
  selectInterestDashboardState,
  (state) => state.returnViewMode
);

// ===========================
// Computed Selectors
// ===========================

/**
 * COMPUTED SELECTORS: Derive new values from state
 * 
 * These selectors perform computations or transformations on the state to derive new values.
 * They demonstrate the power of selector composition and memoization.
 * 
 * THESIS CONTEXT - DERIVED STATE:
 * Instead of storing computed values in state (which would require manual updates), we use
 * selectors to derive them on-demand. Benefits:
 * - Single source of truth: Computed values always match current state
 * - No synchronization bugs: Can't have stale derived values
 * - Memoization: Expensive computations cached automatically
 * - Composability: Complex selectors built from simpler ones
 * 
 * These patterns are essential for scalable state management in complex applications.
 */

/**
 * COMPUTED: interestScore - Normalized interest score (0.0-1.0)
 * DERIVES: Min-Max normalized score from conceptData
 * THESIS: Primary metric of Interest Level feature - represents user's normalized interest
 */
export const selectInterestScore = createSelector(
  selectConceptData,
  (conceptData) => conceptData?.normalized_scores?.min_max_interpolation ?? 0
);

/**
 * COMPUTED: visibleCategories - Filtered category array
 * DERIVES: Only categories where visible=true
 * THESIS: Enables user control over which activity categories to display
 */
export const selectVisibleCategories = createSelector(
  selectActivityCategories,
  (categories) => categories.filter(cat => cat.visible)
);

/**
 * COMPUTED: categoryByKey - Parameterized selector for specific category
 * DERIVES: Single category matching the provided key
 * PATTERN: Parameterized selector - takes argument to customize behavior
 */
export const selectCategoryByKey = (categoryKey: string) =>
  createSelector(selectActivityCategories, (categories) =>
    categories.find(cat => cat.categoryKey === categoryKey)
  );

/**
 * COMPUTED: categoryChartByKey - Parameterized selector for specific category chart
 * DERIVES: Chart config for the specified category
 * FALLBACK: Returns null if category chart not yet initialized
 */
export const selectCategoryChartByKey = (categoryKey: string) =>
  createSelector(selectCategoryCharts, (charts) => charts[categoryKey] || null);

/**
 * COMPUTED: hasData - Boolean data availability check
 * DERIVES: Whether concept data has been loaded
 * THESIS: Used for conditional rendering - show content vs loading vs empty state
 */
export const selectHasData = createSelector(
  selectConceptData,
  (conceptData) => conceptData !== null
);

/**
 * COMPUTED: totalActivityCount - Sum of all user activities
 * DERIVES: Total activity count across all categories
 * THESIS: Shows engagement level - provides context for interest score
 */
export const selectTotalActivityCount = createSelector(
  selectConceptData,
  (conceptData) => conceptData?.total_activity_count ?? 0
);

/**
 * COMPUTED: rawScore - Un-normalized weighted activity count
 * DERIVES: Raw score before Min-Max normalization
 * THESIS: Used for contribution percentage calculations (contribution/raw_score * 100%)
 * FORMULA: raw_score = sum(activity_count * activity_weight)
 */
export const selectRawScore = createSelector(
  selectConceptData,
  (conceptData) => conceptData?.raw_score ?? 0
);
