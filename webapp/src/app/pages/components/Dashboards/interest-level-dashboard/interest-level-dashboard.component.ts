import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { State } from 'src/app/state/app.state';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { User } from 'src/app/models/User';
import { Course } from 'src/app/models/Course';
import { getCurrentCourse } from 'src/app/pages/courses/state/course.reducer';
import { OverlayPanel } from 'primeng/overlaypanel';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';

// Import NgRx store for interest dashboard
import * as InterestDashboardActions from './store/interest-dashboard.actions';
import * as InterestDashboardSelectors from './store/interest-dashboard.selectors';
import * as PkgInterestActions from '../../knowledge-graph/user-pkg/store/pkg-interest/pkg-interest.actions';

// Import types
import {
  ActivityBreakdown,
  ConceptInterestData,
  ActivityCategoryGroup,
  TopConcept
} from './store/interest-dashboard.state';

/**
 * Interest Level Dashboard Component
 * 
 * ============================================================================
 * THESIS COMPONENT: Open Learner Interest Model - Visual Explanation Dashboard
 * ============================================================================
 * 
 * PURPOSE:
 * This component visualizes a user's interest level in a specific concept,
 * providing transparent explanation of how the interest score was calculated.
 * 
 * THESIS CONTEXT:
 * Part of the "Open Learner Model" thesis implementing:
 * 1. Interest score calculation (backend Python service)
 * 2. Visual explanation of score components (this component)
 * 3. Integration with Personal Knowledge Graph (PKG)
 * 
 * KEY FEATURES:
 * ----------------
 * 1. INTEREST SCORE DISPLAY
 *    - Shows normalized score (0-1) using Min-Max interpolation
 *    - Displays as gauge chart (doughnut chart)
 *    - Color-coded: High (green) | Medium (yellow) | Low (red)
 * 
 * 2. ACTIVITY BREAKDOWN
 *    - Groups activities into 5 categories: KG, Recommendation, Annotation, Material, Access
 *    - Shows contribution of each activity to final score
 *    - Visualizes with horizontal bar charts
 *    - Formula: Contribution = Count × Weight (from voting system)
 * 
 * 3. ACTIVITY CATEGORIES (based on thesis voting system)
 *    - G1-G10 activities grouped by category
 *    - Weighted by expert votes (7 votes = high importance, 1 vote = low)
 *    - Expandable/collapsible UI to explore details
 * 
 * 4. TOP CONCEPTS COMPARISON
 *    - Shows top N concepts with highest interest scores
 *    - Highlights current concept in orange, others in blue
 *    - Enables comparison with user's other interests
 * 
 * 5. MULTIPLE VIEWS
 *    - Tab 1: User's activities for this concept
 *    - Tab 2: Total activities breakdown
 *    - Tab 3: Top concepts comparison chart
 * 
 * DATA FLOW:
 * ----------
 * 1. Component receives conceptName from route params
 * 2. Dispatches initializeDashboard action to NgRx store
 * 3. Effects call backend API to fetch:
 *    a) ConceptInterestData (score + activities for this concept)
 *    b) TopConcepts[] (user's top N concepts for comparison)
 * 4. Reducer updates state with fetched data
 * 5. Component subscribes to state via selectors
 * 6. Chart initialization functions process data and create visualizations
 * 7. PrimeNG charts render the data
 * 
 * NGRX ARCHITECTURE:
 * ------------------
 * - Store: interest-dashboard.state.ts (defines state shape)
 * - Actions: interest-dashboard.actions.ts (user actions, API calls)
 * - Reducer: interest-dashboard.reducer.ts (state updates)
 * - Effects: interest-dashboard.effects.ts (API calls via InterestLevelService)
 * - Selectors: interest-dashboard.selectors.ts (derived state)
 * 
 * BACKEND INTEGRATION:
 * --------------------
 * Backend endpoints (Python service):
 * - GET /interest-level/user/{userId}/concept/{conceptName}
 *   Returns: ConceptInterestData with score and activities
 * 
 * - GET /interest-level/user/{userId}/top-concepts?limit=N
 *   Returns: Array of top N concepts by score
 * 
 * CHART LIBRARY:
 * --------------
 * Uses PrimeNG Charts (wrapper around Chart.js)
 * - Gauge Chart: Interest score visualization
 * - Bar Charts: Activity breakdowns and comparisons
 * 
 * SPECIAL HANDLING:
 * -----------------
 * - NgRx freezes state objects in development mode
 * - Charts need mutable objects, so we deep clone data/options using JSON.parse(JSON.stringify())
 * - Arrays are cloned with spread operator [...array] before sorting
 * 
 * NAVIGATION:
 * -----------
 * User arrives here by:
 * 1. Clicking a concept node in the PKG graph (interest view mode)
 * 2. Route: /pkg/interest-dashboard/:conceptName
 * 3. Can navigate back to graph via "Back to Graph" button
 */
@Component({
  selector: 'app-interest-level-dashboard',
  templateUrl: './interest-level-dashboard.component.html',
  styleUrls: ['./interest-level-dashboard.component.css']
})
export class InterestLevelDashboardComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Observables from Store
  conceptName$ = this.store.select(InterestDashboardSelectors.selectConceptName);
  conceptId$ = this.store.select(InterestDashboardSelectors.selectConceptId);
  conceptData$ = this.store.select(InterestDashboardSelectors.selectConceptData);
  activityCategories$ = this.store.select(InterestDashboardSelectors.selectActivityCategories);
  topConcepts$ = this.store.select(InterestDashboardSelectors.selectTopConcepts);
  loading$ = this.store.select(InterestDashboardSelectors.selectLoading);
  loadingTopConcepts$ = this.store.select(InterestDashboardSelectors.selectLoadingTopConcepts);
  interestScore$ = this.store.select(InterestDashboardSelectors.selectInterestScore);
  gaugeChart$ = this.store.select(InterestDashboardSelectors.selectGaugeChart);
  totalActivitiesChart$ = this.store.select(InterestDashboardSelectors.selectTotalActivitiesChart);
  topConceptsChart$ = this.store.select(InterestDashboardSelectors.selectTopConceptsChart);
  categoryCharts$ = this.store.select(InterestDashboardSelectors.selectCategoryCharts);
  activeTabIndex$ = this.store.select(InterestDashboardSelectors.selectActiveTabIndex);
  topConceptsLimit$ = this.store.select(InterestDashboardSelectors.selectTopConceptsLimit);
  visibleCategories$ = this.store.select(InterestDashboardSelectors.selectVisibleCategories);
  
  loggedInUser: User | null = null;
  currentCourse: Course | null = null;
  
  // Local copies for template use (will be subscribed from store)
  conceptName: string = '';
  conceptId: string = '';
  interestScore: number = 0;
  conceptData: ConceptInterestData | null = null;
  activityCategories: ActivityCategoryGroup[] = [];
  topConcepts: TopConcept[] = [];
  topConceptsLimit: number | 'All' = 5;
  
  @ViewChild('activityFilterPanel') activityFilterPanel!: OverlayPanel;

  activeTabIndex: number = 0;
  tabs = [
    { label: 'My Activities', value: 'user-activities' },
    { label: 'Total Activities', value: 'all-activities' },
    { label: 'Concepts with Highest Score', value: 'highest-concepts' }
  ];

  // Activity categories - now managed by store
  // activityCategories: ActivityCategoryGroup[] = [];

  // Activity group mapping from activity-weights.json
  private activityGroupMapping: { [key: string]: { name: string; groups: string[]; totalWeight: number } } = {
    'kg': {
      name: 'Knowledge Graph Activities',
      groups: ['G2', 'G3', 'G4'], // Concepts & Article, Mark U/DNU, Full Article
      totalWeight: 0.5 // 0.1944 + 0.1667 + 0.1389 normalized weights
    },
    'recommendation': {
      name: 'Recommendation Activities',
      groups: ['G1', 'G5', 'G7', 'G9'], // Recommended Material, Explanation, Recommended Concepts, Mark Recommended DNU
      totalWeight: 0.3889 // 0.1944 + 0.1111 + 0.0556 + 0.0278 normalized weights
    },
    'annotation': {
      name: 'Annotation Activities',
      groups: ['G6'], // Follow Annotation
      totalWeight: 0.0556 // normalized weight
    },
    'material': {
      name: 'Material Activities',
      groups: ['G8'], // View Slides
      totalWeight: 0.0278 // normalized weight
    },
    'access': {
      name: 'Access Activities',
      groups: ['G10'], // Course Access
      totalWeight: 0.0278 // normalized weight
    }
  };

  // For "Concepts with Highest Score" tab - now managed by store
  // topConcepts: Array<{ name: string; score: number; course: string }> = [];

  // Gauge chart for interest score visualization - now managed by store
  gaugeData: any;
  gaugeOptions: any;

  // Chart data for activity visualizations - now managed by store
  categoryChartData: { [key: string]: any } = {};
  categoryChartOptions: { [key: string]: any } = {};

  // Chart colors
  chartColors = {
    primary: '#3B82F6',
    secondary: '#10B981',
    accent: '#F59E0B',
    danger: '#EF4444',
    purple: '#8B5CF6'
  };

  // Total activities chart data - now managed by store
  totalActivitiesChartData: any;
  totalActivitiesChartOptions: any;

  // Top concepts chart data - now managed by store
  topConceptsChartData: any;
  topConceptsChartOptions: any;
  // topConceptsLimit: number | 'All' = 5; // now from store

  // Top-N filter options (matching PKG filter controls)
  readonly topNOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
    { label: '20', value: 20 },
    { label: '25', value: 25 },
    { label: '50', value: 50 }
  ];

  // Activity name mapping for user-friendly labels
  private activityNameMapping: { [key: string]: string } = {
    'user enrolled in course teaching this concept': 'You enrolled in course teaching this concept',
    'user viewed article of concept': 'You viewed article of this concept',
    'user marked concept as understood': 'You marked concept as understood',
    'user marked concept as not understood': 'You marked concept as not understood',
    'user viewed full article of concept': 'You viewed full article of this concept',
    'user followed annotation for concept': 'You followed annotation for this concept',
    'user viewed slide containing concept': 'You viewed slide containing this concept',
    'user accessed course teaching concept': 'You accessed course teaching this concept',
    'system recommended material containing concept': 'You received recommended material containing this concept',
    'system recommended concept': 'You received recommendation for this concept',
    'user viewed recommended material containing concept': 'You viewed recommended material containing this concept',
    'user viewed explanation for concept': 'You viewed explanation for this concept',
    'user marked recommended concept as not understood': 'You marked recommended concept as not understood'
  };

  constructor(
    private route: ActivatedRoute,
    private store: Store<State>
  ) {}

  /**
   * LIFECYCLE: Component Initialization
   * 
   * Called when the component is initialized. This is the entry point for setting up the Interest Level Dashboard.
   * 
   * INITIALIZATION FLOW:
   * 1. Configure PKG Interest store to ensure "Back" button returns to interest view (not graph/concept view)
   * 2. Subscribe to logged-in user from global state
   * 3. Subscribe to current course from global state
   * 4. Subscribe to route query params to get conceptName and conceptId from URL
   * 5. Dispatch NgRx actions to initialize dashboard data (triggers API calls in effects)
   * 6. Subscribe to store state for local copies needed by chart libraries
   * 
   * THESIS CONTEXT:
   * This method orchestrates the complete initialization of the Interest Level Dashboard, which is the
   * core visualization component of the thesis. It connects user context, route parameters, and store
   * state to fetch and display personalized interest scores for a specific concept.
   * 
   * The initialization follows the NgRx pattern:
   * - Component dispatches actions (e.g., initializeDashboard)
   * - Effects intercept actions and make API calls to Python backend
   * - Reducer updates state with API responses
   * - Component subscribes to state selectors and updates UI
   * 
   * @returns void
   */
  ngOnInit(): void {
    // Set return view mode in PKG Interest store so back button returns to interest view
    this.store.dispatch(PkgInterestActions.setReturnViewMode({ viewMode: 'interest' }));
    
    // Subscribe to user
    this.store
      .select(getLoggedInUser)
      .pipe(
        takeUntil(this.destroy$),
        filter((user): user is User => user !== null)
      )
      .subscribe((user) => {
        this.loggedInUser = user;
      });

    // Subscribe to current course
    this.store
      .select(getCurrentCourse)
      .pipe(takeUntil(this.destroy$))
      .subscribe((course) => {
        this.currentCourse = course;
      });
    
    // Subscribe to route params and initialize dashboard
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe(params => {
        const conceptName = params['conceptName'] || '';
        const conceptId = params['conceptId'] || '';
        
        if (conceptName && conceptId) {
          // Dispatch actions to set params and initialize dashboard
          this.store.dispatch(InterestDashboardActions.setConceptParams({ conceptName, conceptId }));
          
          if (this.loggedInUser) {
            this.store.dispatch(InterestDashboardActions.initializeDashboard({
              userId: this.loggedInUser.id,
              conceptName
            }));
          }
        }
      });
    
    // Subscribe to store state for local copies (for chart libraries that need direct refs)
    this.subscribeToStoreState();
  }
  
  /**
   * STORE SUBSCRIPTIONS: Set up reactive data flow from NgRx store
   * 
   * Establishes subscriptions to all relevant store selectors to keep component state in sync with
   * the centralized NgRx store. This method is critical for the reactive architecture of the dashboard.
   * 
   * SUBSCRIPTION PATTERN:
   * Each subscription follows the pattern:
   * 1. Select data from store using selector
   * 2. Take values until component is destroyed (prevents memory leaks)
   * 3. Update local properties with new values
   * 4. Trigger chart initialization when dependencies are met
   * 
   * WHY LOCAL COPIES?
   * PrimeNG Chart component needs direct references to data objects. While we store canonical data
   * in NgRx store, we maintain local copies for chart libraries. We MUST clone these objects before
   * passing to charts because NgRx freezes objects in development mode (Object.freeze), and Chart.js
   * internally modifies config objects, which would throw "Cannot assign to read only property" errors.
   * 
   * TIMING DEPENDENCIES:
   * - Gauge chart initializes when conceptData arrives (only needs score)
   * - Category charts initialize when BOTH conceptData AND activityCategories are available
   * - Total activities chart initializes when BOTH conceptData AND activityCategories are available
   * - Top concepts chart initializes when topConcepts array arrives
   * 
   * This timing ensures charts always have the data they need before rendering.
   * 
   * THESIS CONTEXT:
   * This subscription setup is essential for the reactive nature of the dashboard. As user interactions
   * occur (e.g., changing top-N filter, toggling categories), the store updates and these subscriptions
   * automatically refresh the UI. This demonstrates the unidirectional data flow pattern of NgRx:
   * Actions → Effects → Reducer → Store → Selectors → Component
   * 
   * @returns void
   */
  private subscribeToStoreState(): void {
    // Subscribe to concept data for local processing
    this.conceptData$.pipe(takeUntil(this.destroy$)).subscribe(data => {
      if (data) {
        this.conceptData = data;
        this.interestScore = data.normalized_scores.min_max_interpolation;
        // Initialize categories and gauge chart when data changes
        this.initializeActivityCategories();
        this.initializeGaugeChart();
        // Note: Category and total activities charts are initialized when activityCategories$ updates
      }
    });
    
    // Subscribe to activity categories for local copy and chart initialization
    this.activityCategories$.pipe(takeUntil(this.destroy$)).subscribe(categories => {
      this.activityCategories = categories;
      // Initialize charts when categories are available
      if (categories.length > 0 && this.conceptData) {
        this.initializeCategoryCharts();
        this.initializeTotalActivitiesChart();
      }
    });
    
    // Subscribe to top concepts for local copy and chart initialization
    this.topConcepts$.pipe(takeUntil(this.destroy$)).subscribe(concepts => {
      this.topConcepts = concepts;
      if (concepts.length > 0) {
        this.initializeTopConceptsChart();
      }
    });
    
    // Subscribe to top concepts limit for local copy
    this.topConceptsLimit$.pipe(takeUntil(this.destroy$)).subscribe(limit => {
      this.topConceptsLimit = limit;
    });
    
    // Subscribe to active tab index for local copy
    this.activeTabIndex$.pipe(takeUntil(this.destroy$)).subscribe(index => {
      this.activeTabIndex = index;
    });
    
    // Subscribe to concept name/id for local copies
    this.conceptName$.pipe(takeUntil(this.destroy$)).subscribe(name => {
      this.conceptName = name;
    });
    
    this.conceptId$.pipe(takeUntil(this.destroy$)).subscribe(id => {
      this.conceptId = id;
    });
  }

  /**
   * LIFECYCLE: Component Cleanup
   * 
   * Called when the component is about to be destroyed. Performs cleanup to prevent memory leaks
   * and resets dashboard state in the store.
   * 
   * CLEANUP STEPS:
   * 1. Signal destroy$ Subject to complete all takeUntil() subscriptions
   * 2. Complete the destroy$ Subject itself
   * 3. Dispatch clearDashboard action to reset store state
   * 
   * WHY CLEAR STATE?
   * When user navigates away from the Interest Level Dashboard, we clear the store state to:
   * - Prevent stale data from appearing when navigating to a different concept
   * - Free memory by removing large activity breakdown arrays
   * - Reset UI state (active tab, filter settings, etc.)
   * 
   * THESIS CONTEXT:
   * Proper cleanup is essential for a production application. The Interest Level Dashboard may
   * contain hundreds of activity records for popular concepts. Clearing state ensures the app
   * doesn't accumulate memory over time as users navigate between different concept dashboards.
   * 
   * @returns void
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Clear dashboard state
    this.store.dispatch(InterestDashboardActions.clearDashboard());
  }

  /**
   * DATA PROCESSING: Group activities into categories based on thesis voting system
   * 
   * This method is CRITICAL to the thesis as it organizes raw activity data from the backend into
   * meaningful categories that align with the expert-weighted voting system used to calculate interest scores.
   * 
   * ACTIVITY GROUPING LOGIC:
   * The backend Python service calculates interest scores using a weighted voting system where activities
   * are grouped into 10 groups (G1-G10). Each group has a weight determined by expert voting:
   * - G2, G3, G4 (Knowledge Graph): Combined weight 0.5
   * - G1, G5, G7, G9 (Recommendation): Combined weight 0.3889
   * - G6 (Annotation): Weight 0.0556
   * - G8 (Material): Weight 0.0278
   * - G10 (Access): Weight 0.0278
   * 
   * This method groups activities into 5 UI categories that correspond to these weighted groups.
   * 
   * PROCESSING STEPS:
   * 1. Create empty category buckets (kg, recommendation, annotation, material, access)
   * 2. Iterate through activities_breakdown array from API response
   * 3. Extract group ID from activity_id (format: "G1_A1" → "G1")
   * 4. Match group ID to appropriate category using activityGroupMapping
   * 5. Add activity to matching category (each activity appears in only ONE category)
   * 6. Calculate totals (count, contribution) for each category
   * 7. Filter out empty categories (categories with no user activities)
   * 8. Sort categories by total weight (highest to lowest) to show most important categories first
   * 9. Dispatch categorized data to store
   * 
   * WHY THIS MATTERS FOR THESIS:
   * - Shows user WHERE their interest score comes from (visual explanation)
   * - Aligns UI with backend calculation methodology (transparency)
   * - Reveals which types of interactions contribute most to interest
   * - Supports the Open Learner Model principle of making the model visible and understandable
   * 
   * EXAMPLE:
   * If user has activities: ["G1_A1" (count=5), "G2_A1" (count=3), "G6_A1" (count=1)]
   * Result:
   * - Recommendation category: 5 activities from G1
   * - Knowledge Graph category: 3 activities from G2
   * - Annotation category: 1 activity from G6
   * 
   * @returns void - Dispatches setActivityCategories action to update store
   */
  private initializeActivityCategories(): void {
    if (!this.conceptData) return;

    // Group activities by category
    const categories: { [key: string]: ActivityBreakdown[] } = {
      annotation: [],
      material: [],
      access: [],
      kg: [],
      recommendation: []
    };

    this.conceptData.activities_breakdown.forEach(activity => {
      // Determine which category this activity belongs to based on its group ID
      const groupId = activity.activity_id.split('_')[0]; // e.g., "G1" from "G1_A1"

      // Find the first matching category and add activity only to that category
      for (const [categoryKey, categoryInfo] of Object.entries(this.activityGroupMapping)) {
        if (categoryInfo.groups.includes(groupId)) {
          categories[categoryKey].push(activity);
          break; // Prevent activity from appearing in multiple categories
        }
      }
    });

    // Build activity category groups
    const activityCategories = Object.entries(this.activityGroupMapping).map(([key, info]) => {
      const activities = categories[key] || [];
      return {
        categoryName: info.name,
        categoryKey: key,
        activities: activities,
        totalCount: activities.reduce((sum, a) => sum + a.count, 0),
        totalContribution: activities.reduce((sum, a) => sum + a.contribution, 0),
        expanded: false,
        visible: true,
        showTextView: activities.length === 1 // Default to text view if only one activity
      };
    })
    .filter(cat => cat.activities.length > 0) // Only show categories with activities
    .sort((a, b) => {
      // Sort by total weight from voting system (highest to lowest)
      const weightA = this.activityGroupMapping[a.categoryKey]?.totalWeight || 0;
      const weightB = this.activityGroupMapping[b.categoryKey]?.totalWeight || 0;
      return weightB - weightA;
    });
    
    // Dispatch to store
    this.store.dispatch(InterestDashboardActions.setActivityCategories({ categories: activityCategories }));
  }

  /**
   * USER INTERACTION: Toggle expansion state of activity category
   * 
   * Called when user clicks on a category header to expand or collapse the detailed view.
   * Dispatches action to update the category's 'expanded' property in store.
   * 
   * THESIS CONTEXT - PROGRESSIVE DISCLOSURE:
   * Categories start collapsed to avoid overwhelming users with details. Users can click to expand
   * categories they want to inspect more closely. This progressive disclosure pattern supports
   * the Open Learner Model by making detailed information available without forcing it on users.
   * 
   * @param category The category group to toggle
   * @returns void - Dispatches toggleCategoryExpand action
   */
  toggleCategory(category: ActivityCategoryGroup): void {
    this.store.dispatch(InterestDashboardActions.toggleCategoryExpand({ categoryKey: category.categoryKey }));
  }

  /**
   * USER INTERACTION: Switch between text list view and chart view for a category
   * 
   * Called when user clicks the view toggle button for a category. Allows switching between:
   * - Text view: Simple list showing activity names, counts, and contribution percentages
   * - Chart view: Bar chart visualizing activity distribution within the category
   * 
   * THESIS CONTEXT - VIEW PREFERENCES:
   * Different users prefer different representations:
   * - Text view: Precise numbers, easier to read specific values, better for accessibility
   * - Chart view: Visual patterns, easier to compare relative sizes, better for quick assessment
   * 
   * By offering both, we accommodate different learning styles and use cases. This supports the
   * Open Learner Model principle that visualizations should be adaptable to user preferences.
   * 
   * SPECIAL CASE - SINGLE ACTIVITY:
   * If category has only one activity, defaults to text view (chart would be uninformative with one bar).
   * 
   * @param category The category group to toggle view for
   * @returns void - Dispatches toggleCategoryView action
   */
  toggleCategoryView(category: ActivityCategoryGroup): void {
    this.store.dispatch(InterestDashboardActions.toggleCategoryView({ categoryKey: category.categoryKey }));
  }

  /**
   * UI HELPER: Check if category has only one activity type
   * 
   * Used for conditional rendering in template - hides the view toggle button when there's only
   * one activity in a category (since a chart with one bar is not useful).
   * 
   * @param category The category group to check
   * @returns boolean - True if category has exactly one activity
   */
  hasSingleActivity(category: ActivityCategoryGroup): boolean {
    return category.activities.length === 1;
  }

  /**
   * TEXT FORMATTING: Convert technical activity names to user-friendly descriptions
   * 
   * Transforms backend activity names (e.g., "user viewed article of concept") into natural,
   * user-facing text (e.g., "You viewed article of this concept"). This makes the interface
   * more personal and easier to understand.
   * 
   * TRANSFORMATION RULES:
   * 1. Check activityNameMapping dictionary for predefined mappings
   * 2. If no mapping exists, apply automatic transformations:
   *    - Replace "user" with "You" (personalization)
   *    - Convert present tense verbs to past tense (views → viewed, marks → marked)
   *    - Ensure sentence starts with "You" and is properly capitalized
   * 
   * THESIS CONTEXT - LANGUAGE PERSONALIZATION:
   * Using "You" instead of "user" makes the Open Learner Model more engaging and personal.
   * Research shows that personalized language increases user engagement with educational systems
   * and improves understanding of system feedback.
   * 
   * Examples:
   * - "user viewed article of concept" → "You viewed article of this concept"
   * - "user marked concept as understood" → "You marked concept as understood"
   * - "system recommended concept" → "You received recommendation for this concept"
   * 
   * FALLBACK HANDLING:
   * If activity name doesn't match any known pattern, method still applies basic transformations
   * to ensure output is reasonably user-friendly. This handles unexpected activity types gracefully.
   * 
   * @param activityName The technical activity name from backend (e.g., "user viewed article")
   * @returns string - User-friendly activity description (e.g., "You viewed article")
   */
  getFriendlyActivityName(activityName: string): string {
    // Return mapped name if exists, otherwise return original with fallback formatting
    const mapped = this.activityNameMapping[activityName.toLowerCase()];
    if (mapped) {
      return mapped;
    }
    
    // Fallback: Replace 'user' with 'You', convert present tense verbs to past tense
    let friendly = activityName.replace(/^user /i, 'You ');
    
    // Convert common present tense verbs to past tense
    friendly = friendly.replace(/\bviews?\b/gi, 'viewed');
    friendly = friendly.replace(/\bmarks?\b/gi, 'marked');
    friendly = friendly.replace(/\baccess(es)?\b/gi, 'accessed');
    friendly = friendly.replace(/\benrolls?\b/gi, 'enrolled');
    friendly = friendly.replace(/\bfollows?\b/gi, 'followed');
    friendly = friendly.replace(/\brecommends?\b/gi, 'recommended');
    friendly = friendly.replace(/\bclicks?\b/gi, 'clicked');
    friendly = friendly.replace(/\bopens?\b/gi, 'opened');
    friendly = friendly.replace(/\breads?\b/gi, 'read');
    friendly = friendly.replace(/\bwatches?\b/gi, 'watched');
    friendly = friendly.replace(/\bcompletes?\b/gi, 'completed');
    
    // If string doesn't start with "You", add it
    if (!friendly.match(/^You\b/i)) {
      friendly = 'You ' + friendly.toLowerCase();
    }
    
    // Capitalize first letter
    return friendly.replace(/^(\w)/, (c) => c.toUpperCase());
  }

  /**
   * USER INTERACTION: Open the activity filter overlay panel
   * 
   * Called when user clicks the filter button. Opens a PrimeNG OverlayPanel showing checkboxes
   * for each activity category, allowing users to show/hide categories from the visualization.
   * 
   * THESIS CONTEXT - CUSTOMIZABLE VIEW:
   * Users may want to focus on specific types of activities (e.g., only show Knowledge Graph and
   * Recommendation activities, hide others). This filtering supports personalized exploration of
   * the interest model, letting users investigate specific interaction patterns.
   * 
   * @param event The click event (used for positioning the overlay panel)
   * @returns void - Toggles the activityFilterPanel component
   */
  openActivityFilter(event: Event): void {
    this.activityFilterPanel.toggle(event);
  }

  /**
   * USER INTERACTION: Toggle visibility of a specific activity category
   * 
   * Called when user checks/unchecks a category in the filter panel. Dispatches action to update
   * the category's 'visible' property in store, which controls whether the category appears in
   * the "Your Activities Breakdown" section.
   * 
   * THESIS CONTEXT - FOCUSED EXPLORATION:
   * By hiding categories with low activity counts or categories the user isn't interested in,
   * users can create a focused view that highlights the interactions most relevant to their
   * exploration goals. This supports the Open Learner Model principle of user control over
   * the visualization.
   * 
   * Example use case:
   * User has 50 Recommendation activities but only 2 Access activities. They might hide Access
   * to focus the visualization on categories with substantial data.
   * 
   * @param categoryKey The key identifying the category (e.g., 'kg', 'recommendation')
   * @returns void - Dispatches toggleCategoryVisibility action
   */
  toggleCategoryVisibility(categoryKey: string): void {
    this.store.dispatch(InterestDashboardActions.toggleCategoryVisibility({ categoryKey }));
  }

  /**
   * UI HELPER: Get color class for interest score based on thresholds
   * 
   * Returns a Tailwind CSS color class that visually indicates the interest level category.
   * Used for the score display text and gauge chart color.
   * 
   * THRESHOLDS:
   * - High interest: score >= 0.7 (70%) → Green (text-green-600)
   * - Medium interest: 0.4 <= score < 0.7 → Yellow (text-yellow-600)
   * - Low interest: score < 0.4 (40%) → Red (text-red-600)
   * 
   * THESIS CONTEXT - COLOR SEMANTICS:
   * Color provides immediate visual feedback about interest level without requiring users to
   * interpret numerical values. The thresholds (0.7, 0.4) were chosen to create a balanced
   * distribution that aligns with common 70% = good, 40% = minimal benchmarks used in education.
   * 
   * @returns string - Tailwind CSS color class (e.g., 'text-green-600')
   */
  getInterestScoreColor(): string {
    if (this.interestScore >= 0.7) return 'text-green-600';
    if (this.interestScore >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  }

  /**
   * UI HELPER: Get text label for interest level category
   * 
   * Returns a human-readable label ('High Interest', 'Medium Interest', 'Low Interest') that
   * categorizes the numerical score into discrete levels. Displayed alongside the score number
   * and color indicator.
   * 
   * THRESHOLDS: (Same as getInterestScoreColor())
   * - High interest: score >= 0.7
   * - Medium interest: 0.4 <= score < 0.7
   * - Low interest: score < 0.4
   * 
   * THESIS CONTEXT - MULTI-MODAL FEEDBACK:
   * Combining numerical score (0.75), color (green), and label ("High Interest") provides
   * multiple ways to understand the interest level. This multi-modal approach ensures:
   * - Precision: Exact score available for users who want it
   * - Speed: Color and label for quick recognition
   * - Accessibility: Text label for users who can't distinguish colors
   * 
   * @returns string - Interest level label ('High Interest', 'Medium Interest', or 'Low Interest')
   */
  getInterestScoreLabel(): string {
    if (this.interestScore >= 0.7) return 'High Interest';
    if (this.interestScore >= 0.4) return 'Medium Interest';
    return 'Low Interest';
  }

  /**
   * USER INTERACTION: Handle tab selection change
   * 
   * Called when user clicks a different tab in the dashboard (Total Activities vs Top Concepts).
   * Dispatches action to update activeTabIndex in store, which controls which content panel is displayed.
   * 
   * THESIS CONTEXT - MULTIPLE PERSPECTIVES:
   * The dashboard offers two complementary views of interest data:
   * 1. Total Activities tab: Shows current concept's activity breakdown (detailed, specific)
   * 2. Top Concepts tab: Shows current concept vs top interests (comparative, contextual)
   * 
   * Both views are necessary for a complete understanding:
   * - Activities: "Why is my score X?" (explanation)
   * - Comparison: "Is score X high for me?" (context)
   * 
   * @param event PrimeNG TabView change event containing the new tab index
   * @returns void - Dispatches setActiveTab action
   */
  onTabChange(event: any): void {
    this.store.dispatch(InterestDashboardActions.setActiveTab({ tabIndex: event.index }));
  }

  /**
   * UI HELPER: Get array of visible activity categories (respecting user filters)
   * 
   * Filters the activityCategories array to return only categories where visible=true.
   * Used in template to render only the categories the user hasn't hidden via the filter panel.
   * 
   * THESIS CONTEXT - FILTERED VIEW:
   * This method enables the category filtering feature. When user unchecks a category in the
   * filter panel, its visible property becomes false, and this method excludes it from rendering.
   * The filtered view helps users focus on relevant activity types.
   * 
   * @returns ActivityCategoryGroup[] - Array of visible categories
   */
  getVisibleCategories(): ActivityCategoryGroup[] {
    return this.activityCategories.filter(c => c.visible);
  }

  /**
   * DATA FORMATTING: Calculate and format activity contribution as percentage of total raw score
   * 
   * Takes an activity's contribution value and expresses it as a percentage of the total raw score.
   * This shows users "what percentage of my score came from this specific activity?"
   * 
   * CALCULATION:
   * percentage = (activity_contribution / total_raw_score) * 100
   * 
   * THESIS CONTEXT - CONTRIBUTION TRANSPARENCY:
   * This calculation is fundamental to the visual explanation strategy. It answers:
   * "How much did THIS activity contribute to my score?"
   * 
   * Example:
   * - Total raw score: 1.5
   * - Activity contribution: 0.45
   * - Result: 30.0% (this activity contributed 30% of the total score)
   * 
   * WHY RAW SCORE DENOMINATOR?
   * We use raw_score (not normalized score) as the denominator because contributions are in the
   * same units as raw score. Both come from the weighted activity count calculation:
   * raw_score = sum(activity_count * activity_weight)
   * 
   * PRECISION HANDLING:
   * - Normal case: 1 decimal place (30.0%)
   * - Very small contributions: 4 decimal places (0.0523%)
   * 
   * This prevents showing "0.0%" for activities that do contribute but have very small impact.
   * 
   * EDGE CASE HANDLING:
   * If raw_score is 0 (no activities), returns "0%" to avoid division by zero.
   * 
   * @param contribution The activity's contribution value from backend
   * @returns string - Formatted percentage (e.g., "30.0%" or "0.0523%")
   */
  // Format contribution as percentage of total raw score
  getContributionPercentage(contribution: number): string {
    if (!this.conceptData || this.conceptData.raw_score === 0) return '0%';
    const percentage = (contribution / this.conceptData.raw_score) * 100;
    // Show more decimal places for very small percentages to avoid displaying 0.0%
    if (percentage < 0.1 && percentage > 0) {
      return percentage.toFixed(4) + '%';
    }
    return percentage.toFixed(1) + '%';
  }

  /**
   * DATA FORMATTING: Calculate and format category total contribution as percentage of raw score
   * 
   * Same logic as getContributionPercentage() but for an entire category's total contribution
   * (sum of all activities in that category). Shows "what percentage of my score came from this
   * category of activities?"
   * 
   * CALCULATION:
   * percentage = (category_total_contribution / total_raw_score) * 100
   * 
   * THESIS CONTEXT - CATEGORY-LEVEL TRANSPARENCY:
   * This shows the aggregate impact of activity categories:
   * - "Knowledge Graph activities contributed 50% of your score"
   * - "Recommendation activities contributed 35% of your score"
   * 
   * Combined with individual activity percentages, this creates a hierarchical understanding:
   * - Category level: "Recommendation = 35%"
   * - Activity level: "Viewed recommended material = 20%, Viewed explanation = 15%"
   * 
   * EXPECTED RELATIONSHIP:
   * Sum of category percentages should equal 100% (allowing for rounding errors), since categories
   * partition all activities and contributions add up to the total raw score.
   * 
   * @param totalContribution Sum of contributions for all activities in a category
   * @returns string - Formatted percentage (e.g., "35.0%" or "0.0523%")
   */
  // Format category contribution as percentage of total raw score
  getCategoryContributionPercentage(totalContribution: number): string {
    if (!this.conceptData || this.conceptData.raw_score === 0) return '0%';
    const percentage = (totalContribution / this.conceptData.raw_score) * 100;
    // Show more decimal places for very small percentages to avoid displaying 0.0%
    if (percentage < 0.1 && percentage > 0) {
      return percentage.toFixed(4) + '%';
    }
    return percentage.toFixed(1) + '%';
  }

  /**
   * CHART INITIALIZATION: Create gauge chart for interest score visualization
   * 
   * This method creates a semi-circular gauge chart (doughnut chart with 180° arc) to display the
   * user's normalized interest score for the current concept. The gauge provides an intuitive,
   * at-a-glance visualization of interest level.
   * 
   * VISUALIZATION DESIGN:
   * - Score segment: Filled portion representing normalized score (0.0 to 1.0)
   * - Remaining segment: Gray portion representing unused capacity
   * - Color coding: Green (high ≥ 0.7), Yellow (medium 0.4-0.7), Red (low < 0.4)
   * - Semi-circle shape: cutout 70%, rotation -90°, circumference 180°
   * 
   * THESIS CONTEXT - NORMALIZATION:
   * The score displayed is normalized_scores.min_max_interpolation from the backend Python service.
   * This is the MIN-MAX NORMALIZED score, which scales the raw weighted activity count to [0, 1] range:
   * 
   * Formula: normalized_score = (raw_score - min_score) / (max_score - min_score)
   * 
   * Why normalize?
   * - Different concepts have vastly different activity counts (popular vs niche concepts)
   * - Normalization makes scores comparable across concepts
   * - A score of 0.8 means user's interest is at 80% of the maximum observed interest for ANY concept
   * 
   * FROZEN OBJECT HANDLING:
   * Must clone gaugeData and gaugeOptions using JSON.parse(JSON.stringify()) before assigning to
   * local properties. NgRx freezes objects in development mode, but Chart.js modifies config objects
   * internally (e.g., setting responsive properties), which would throw errors on frozen objects.
   * 
   * @returns void - Dispatches setGaugeChart action to update store
   */
  // Initialize gauge chart for interest score (matching engagement dashboard style)
  private initializeGaugeChart(): void {
    const score = this.interestScore;
    const remaining = 1 - score;

    const gaugeData = {
      labels: ['Interest Score', 'Remaining'],
      datasets: [
        {
          data: [score, remaining],
          backgroundColor: [
            this.getInterestScoreColor() === 'text-green-600' ? '#10B981' :
            this.getInterestScoreColor() === 'text-yellow-600' ? '#F59E0B' : '#EF4444',
            '#E5E7EB'
          ],
          borderWidth: 0
        }
      ]
    };

    const gaugeOptions = {
      responsive: true,
      cutout: '70%',
      rotation: -90,
      circumference: 180,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      maintainAspectRatio: true
    };
    
    // Store in local properties for chart library (clone to avoid frozen state object errors)
    this.gaugeData = JSON.parse(JSON.stringify(gaugeData));
    this.gaugeOptions = JSON.parse(JSON.stringify(gaugeOptions));
    
    // Dispatch to store
    this.store.dispatch(InterestDashboardActions.setGaugeChart({ data: gaugeData, options: gaugeOptions }));
  }

  /**
   * CHART ORCHESTRATION: Initialize charts for all activity categories
   * 
   * Iterates through all activity categories and creates a bar chart for each one showing the
   * individual activities within that category and their counts.
   * 
   * THESIS CONTEXT:
   * Each category (e.g., "Knowledge Graph Activities") may contain multiple specific activities
   * (e.g., "viewed article", "marked understood", "viewed full article"). This method creates
   * detailed visualizations for each category, allowing users to see which specific interactions
   * contribute to their interest score.
   * 
   * This supports the Open Learner Model principle of granular transparency - users can drill down
   * from category-level ("Recommendation Activities: 15 total") to activity-level ("viewed recommended
   * material: 10 times, viewed explanation: 5 times").
   * 
   * @returns void - Calls initializeCategoryChart() for each category
   */
  // Initialize Chart.js charts for each category
  private initializeCategoryCharts(): void {
    if (!this.conceptData) return;

    this.activityCategories.forEach(category => {
      this.initializeCategoryChart(category);
    });
  }

  /**
   * CHART INITIALIZATION: Create bar chart showing total activities by category
   * 
   * Creates a bar chart displaying the distribution of user activities across the 5 major categories
   * (Knowledge Graph, Recommendation, Annotation, Material, Access). This chart appears in the
   * "Total Activities" tab and provides a high-level overview of where the user's interactions are concentrated.
   * 
   * CHART DESIGN:
   * - X-axis: Category names (e.g., "Knowledge Graph Activities")
   * - Y-axis: Total activity count (sum of all activities in that category)
   * - Color coding: Each category has a distinct color for visual differentiation
   * - Sorted by weight: Categories appear in order of their importance to the interest score
   * 
   * THESIS CONTEXT - VISUAL EXPLANATION:
   * This chart is part of the "visual explanation" strategy for the Open Learner Model. It answers:
   * "WHY is my interest score X?" → "Because you have Y activities in Knowledge Graph, Z in Recommendation, etc."
   * 
   * By showing the activity distribution, users can understand:
   * - Which categories they interact with most
   * - Whether their interest score is driven by diverse interactions or dominated by one category
   * - How their interaction pattern compares to the weighted voting system
   * 
   * EXAMPLE:
   * If chart shows:
   * - Recommendation: 20 activities (40% of score)
   * - Knowledge Graph: 15 activities (50% of score)
   * - Material: 5 activities (10% of score)
   * 
   * User can see their score is primarily driven by Knowledge Graph activities (highest weight),
   * despite having more Recommendation activities.
   * 
   * DEFENSIVE PROGRAMMING:
   * Checks for both conceptData and activityCategories availability before initializing.
   * This prevents errors during the async data loading phase.
   * 
   * FROZEN OBJECT HANDLING:
   * Must clone chartData and chartOptions before assignment. See initializeGaugeChart() for details.
   * 
   * @returns void - Dispatches setTotalActivitiesChart action to update store
   */
  // Initialize total activities chart (for "Total Activities" tab)
  private initializeTotalActivitiesChart(): void {
    if (!this.conceptData || !this.activityCategories || this.activityCategories.length === 0) return;

    // Get category labels and their total counts
    const labels = this.activityCategories.map(cat => cat.categoryName);
    const counts = this.activityCategories.map(cat => cat.totalCount);
    const colors = [
      '#3B82F6', // Blue for Recommendation
      '#F59E0B', // Orange for KG
      '#10B981', // Green for Material
      '#8B5CF6', // Purple for Annotation
      '#EF4444'  // Red for Access
    ];

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Activity Count',
          data: counts,
          backgroundColor: colors.slice(0, labels.length),
          borderColor: colors.slice(0, labels.length),
          borderWidth: 1
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Activity Distribution by Category',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              return `${context.label}: ${context.parsed.y} activities`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grace: '15%',
          grid: {
            display: true,
            drawBorder: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          title: {
            display: true,
            text: 'Number of Activities'
          },
          ticks: {
            precision: 0,
            callback: function(value: any) {
              return Math.floor(value);
            }
          }
        },
        x: {
          grid: {
            display: true,
            drawBorder: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          title: {
            display: true,
            text: 'Activity Category'
          },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0
          }
        }
      },
      onResize: (chart: any) => {
        chart.canvas.parentNode.style.height = '500px';
      }
    };
    
    // Store in local properties for chart library (clone to avoid frozen state object errors)
    this.totalActivitiesChartData = JSON.parse(JSON.stringify(chartData));
    this.totalActivitiesChartOptions = JSON.parse(JSON.stringify(chartOptions));
    
    // Dispatch to store
    this.store.dispatch(InterestDashboardActions.setTotalActivitiesChart({ data: chartData, options: chartOptions }));
  }

  /**
   * CHART INITIALIZATION: Create bar chart for individual category showing activity breakdown
   * 
   * Creates a detailed bar chart for a specific category (e.g., "Knowledge Graph Activities") showing
   * all the individual activities within that category and their counts. Each bar represents one
   * specific activity type (e.g., "You viewed article of this concept").
   * 
   * CHART DESIGN:
   * - X-axis: Activity names (converted to user-friendly labels via getFriendlyActivityName())
   * - Y-axis: Activity count (how many times user performed this activity)
   * - Sorted by weight: Most important activities appear first (left to right)
   * - Color: Single color (primary blue) since all activities are in same category
   * 
   * DATA PROCESSING:
   * 1. Clone activities array to avoid mutating frozen NgRx state (array sorting would fail on frozen array)
   * 2. Sort activities by weight (highest first) to show most impactful activities prominently
   * 3. Map activity names to user-friendly labels ("user viewed article" → "You viewed article")
   * 4. Extract counts for Y-axis values
   * 5. Configure Chart.js options for responsive bar chart
   * 
   * THESIS CONTEXT - GRANULAR TRANSPARENCY:
   * This chart is the most detailed level of the visual explanation hierarchy:
   * 1. Gauge chart: Overall score (0.75)
   * 2. Total activities chart: Category distribution (Recommendation: 20, KG: 15)
   * 3. Category chart (THIS METHOD): Individual activity breakdown (viewed article: 8, marked understood: 5, viewed full article: 2)
   * 
   * This three-level hierarchy allows users to progressively drill down into their interest score,
   * supporting the Open Learner Model principle of making the model's reasoning transparent and inspectable.
   * 
   * WEIGHT SORTING RATIONALE:
   * Activities are sorted by weight (not count) because weight represents the activity's importance
   * to the interest score calculation. An activity with weight=0.1944 and count=5 contributes more
   * to the score than an activity with weight=0.0278 and count=10. Sorting by weight shows users
   * which activities have the most impact.
   * 
   * FROZEN OBJECT HANDLING:
   * - Array cloning: [...category.activities] creates unfrozen copy for sorting
   * - Config cloning: JSON.parse(JSON.stringify()) creates unfrozen copy for Chart.js
   * 
   * @param category The activity category group to create a chart for
   * @returns void - Dispatches setCategoryChart action to update store
   */
  // Initialize chart for individual category using Chart.js format
  private initializeCategoryChart(category: ActivityCategoryGroup): void {
    // Clone activities array to avoid mutating frozen NgRx state
    const activities = [...category.activities].sort((a, b) => b.weight - a.weight);
    const labels = activities.map(a => this.getFriendlyActivityName(a.activity_name));
    const counts = activities.map(a => a.count);
    const contributions = activities.map(a => a.contribution);

    // Bar chart data
    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Activity Count',
          data: counts,
          backgroundColor: this.chartColors.primary,
          borderColor: this.chartColors.primary,
          borderWidth: 1
        }
      ]
    };

    // Chart options
    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const index = context.dataIndex;
              return `Count: ${counts[index]}`;
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grace: '15%',
          grid: {
            display: true,
            drawBorder: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          title: {
            display: true,
            text: 'Activity Count'
          },
          ticks: {
            precision: 0,
            callback: function(value: any) {
              return Math.floor(value);
            }
          }
        },
        x: {
          grid: {
            display: true,
            drawBorder: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0
          }
        }
      },
      onResize: (chart: any) => {
        chart.canvas.parentNode.style.height = '500px';
      }
    };
    
    // Store in local properties for chart library (clone to avoid frozen state object errors)
    this.categoryChartData[category.categoryKey] = JSON.parse(JSON.stringify(chartData));
    this.categoryChartOptions[category.categoryKey] = JSON.parse(JSON.stringify(chartOptions));
    
    // Dispatch to store
    this.store.dispatch(InterestDashboardActions.setCategoryChart({ 
      categoryKey: category.categoryKey,
      data: chartData,
      options: chartOptions
    }));
  }

  /**
   * USER INTERACTION: Handle top-N filter change for concepts comparison chart
   * 
   * Called when user selects a different limit from the dropdown filter (5, 10, 15, 20, 25, 50).
   * Triggers a reload of top concepts data from the backend API and reinitializes the comparison chart.
   * 
   * INTERACTION FLOW:
   * 1. User selects new limit from dropdown (e.g., changes from 5 to 10)
   * 2. This method dispatches setTopConceptsLimit action to update store
   * 3. Method dispatches loadTopConcepts action with new limit
   * 4. Effect intercepts loadTopConcepts and calls API: GET /api/interest-level/top-concepts?limit=10
   * 5. Backend returns top 10 concepts sorted by score
   * 6. Effect dispatches success action with new data
   * 7. Reducer updates topConcepts array in store
   * 8. subscribeToStoreState() detects change and calls initializeTopConceptsChart()
   * 9. Chart updates to show new comparison set
   * 
   * THESIS CONTEXT - USER CONTROL:
   * Giving users control over the comparison set (top-5 vs top-50) supports the Open Learner Model
   * principle of user agency. Users can:
   * - See narrow comparison (top-5) for their absolute best interests
   * - See broad comparison (top-50) to understand their interest distribution across many concepts
   * 
   * Different limits serve different insights:
   * - Top-5: "Is this one of my top interests?"
   * - Top-25: "Where does this rank in my broader interest landscape?"
   * - Top-50: "How does this compare to my entire interest profile?"
   * 
   * SPECIAL CASE - 'All' OPTION:
   * If user selects 'All' (to see all concepts they've interacted with), we convert it to limit=1000
   * before sending to API. This is a practical upper bound - most users won't have interacted with
   * 1000+ distinct concepts. Backend will return all available concepts up to this limit.
   * 
   * @param newLimit The new limit value (5, 10, 15, 20, 25, 50, or 'All')
   * @returns void - Dispatches actions to update limit and reload data
   */
  // Load top concepts for the user
  onTopConceptsLimitChange(newLimit: number | 'All'): void {
    this.store.dispatch(InterestDashboardActions.setTopConceptsLimit({ limit: newLimit }));
    
    if (this.loggedInUser) {
      // Convert 'All' to a large number for the API call
      const limit = newLimit === 'All' ? 1000 : newLimit;
      this.store.dispatch(InterestDashboardActions.loadTopConcepts({ 
        userId: this.loggedInUser.id, 
        limit 
      }));
    }
  }

  /**
   * CHART INITIALIZATION: Create comparison chart showing current concept vs top-scored concepts
   * 
   * Creates a bar chart that compares the current concept's interest score with the user's top N
   * highest-scoring concepts. This provides context for understanding whether the current score is
   * high or low relative to the user's other interests.
   * 
   * CHART DESIGN:
   * - Current concept: Orange bar (always shown first for prominence)
   * - Top concepts: Blue bars (ordered by score, highest to lowest)
   * - Y-axis: Normalized interest score (0.0 to 1.0)
   * - X-axis: Concept names
   * - Highlight: Current concept uses distinct color to stand out
   * 
   * DATA ASSEMBLY LOGIC:
   * 1. Check if current concept is in the top N list
   * 2. If YES: Separate current concept, move it to front, mark with orange color
   * 3. If NO: Add current concept to front with its score from conceptData
   * 4. Add all other top concepts in order with blue color
   * 5. Result: Current concept always appears first, followed by top concepts
   * 
   * THESIS CONTEXT - RELATIVE COMPARISON:
   * This chart addresses the question: "Is my interest score for THIS concept high or low FOR ME?"
   * 
   * Example scenarios:
   * - Current concept score: 0.75, Top concepts: [0.85, 0.80, 0.78] → User sees score is below their usual interests
   * - Current concept score: 0.85, Top concepts: [0.50, 0.45, 0.40] → User sees this is their highest interest
   * - Current concept score: 0.30, Top concepts: [0.85, 0.80, 0.75] → User sees this is a low-interest concept for them
   * 
   * This relative comparison is more meaningful than absolute scores because:
   * - Some users may have generally high engagement (all scores 0.7-0.9)
   * - Some users may have generally low engagement (all scores 0.2-0.4)
   * - Knowing "0.6 is your 2nd highest score" is more actionable than "0.6 is medium"
   * 
   * USER INTERACTION:
   * The top-N value is controlled by a dropdown filter (5, 10, 15, 20, 25, 50 concepts). When changed,
   * the onTopConceptsLimitChange() method dispatches actions to reload data and reinitialize this chart.
   * 
   * FROZEN OBJECT HANDLING:
   * Must clone chartData and chartOptions before assignment. NgRx freezes objects in development mode.
   * 
   * @returns void - Dispatches setTopConceptsChart action to update store
   */
  // Initialize chart for top concepts with current concept highlighted
  private initializeTopConceptsChart(): void {
    if (this.topConcepts.length === 0) return;

    // Separate current concept from top concepts
    const currentConceptData = this.topConcepts.find(c => c.name === this.conceptName);
    const otherTopConcepts = this.topConcepts.filter(c => c.name !== this.conceptName);

    // Build the chart data with current concept first, followed by top N concepts
    const labels: string[] = [];
    const scores: number[] = [];
    const backgroundColors: string[] = [];
    const borderColors: string[] = [];

    // Add current concept first (if it exists)
    if (currentConceptData) {
      labels.push(currentConceptData.name);
      scores.push(currentConceptData.score);
      backgroundColors.push('#F59E0B'); // Orange for current concept
      borderColors.push('#D97706');
    } else if (this.conceptData) {
      // If current concept is not in top concepts, add it with its score
      labels.push(this.conceptName);
      scores.push(this.interestScore);
      backgroundColors.push('#F59E0B'); // Orange for current concept
      borderColors.push('#D97706');
    }

    // Add other top concepts (blue bars)
    otherTopConcepts.forEach(concept => {
      labels.push(concept.name);
      scores.push(concept.score);
      backgroundColors.push('#3B82F6'); // Blue for other concepts
      borderColors.push('#2563EB');
    });

    const chartData = {
      labels: labels,
      datasets: [
        {
          label: 'Interest Score',
          data: scores,
          backgroundColor: backgroundColors,
          borderColor: borderColors,
          borderWidth: 2
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      aspectRatio: 1,
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Current Concept vs Top Concepts',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const score = context.parsed.y;
              const conceptName = context.label;
              const isCurrentConcept = conceptName === this.conceptName;
              return [
                `Score: ${score.toFixed(3)}`,
                isCurrentConcept ? '(Current Concept)' : ''
              ].filter(Boolean);
            }
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          max: 1.0,
          grace: '5%',
          grid: {
            display: true,
            drawBorder: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          title: {
            display: true,
            text: 'Interest Score'
          },
          ticks: {
            stepSize: 0.1
          }
        },
        x: {
          grid: {
            display: true,
            drawBorder: true,
            color: 'rgba(0, 0, 0, 0.1)'
          },
          title: {
            display: true,
            text: 'Concept'
          },
          ticks: {
            autoSkip: false,
            maxRotation: 0,
            minRotation: 0
          }
        }
      },
      onResize: (chart: any) => {
        chart.canvas.parentNode.style.height = '800px';
      }
    };
    
    // Store in local properties for chart library (clone to avoid frozen state object errors)
    this.topConceptsChartData = JSON.parse(JSON.stringify(chartData));
    this.topConceptsChartOptions = JSON.parse(JSON.stringify(chartOptions));
    
    // Dispatch to store
    this.store.dispatch(InterestDashboardActions.setTopConceptsChart({ data: chartData, options: chartOptions }));
  }
}
