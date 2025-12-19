import { Component, Input, OnInit, OnChanges, SimpleChanges, ViewChild, ViewChildren, QueryList, ChangeDetectorRef, HostListener, OnDestroy, ChangeDetectionStrategy, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { OverlayPanel } from 'primeng/overlaypanel';
import { UIChart } from 'primeng/chart';
import { Store } from '@ngrx/store';
import { EngagementMetrics, MaterialDetail, EngagementService, AnnotationActivityDetail, KGActivityDetail, HigherLevelBoundariesResponse, AccessActivityDetail, AccessActivityFrequency, AccessActivitiesResponse } from 'src/app/services/engagement.service';
import { MaterilasService } from 'src/app/services/materials.service';
import { CourseService } from 'src/app/services/course.service';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import * as VideoActions from 'src/app/pages/components/annotations/video-annotation/state/video.action';
import * as NotificationActions from 'src/app/pages/components/notifications/state/notifications.actions';

@Component({
  selector: 'app-engagement-charts',
  templateUrl: './engagement-charts.component.html',
  styleUrls: ['./engagement-charts.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EngagementChartsComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @Input() courseName: string = 'Course name';
  @Input() engagementLevel: string = 'Low';
  @Input() engagementMetrics: EngagementMetrics | null = null;
  @Input() userId: string = '';
  @Input() courseId: string = '';
  @Input() userName: string = 'You';

  activeTabIndex: number = 0;
  /** Counter used to force chart re-rendering on tab change */
  private chartRefreshCounter: number = 0;
  
  /** Cached tab state to avoid repeated method calls in template */
  currentTabValue: string = 'my-activities';
  /** Cached chart data for current tab to avoid recalculation in template */
  private chartDataCache: { [key: string]: any } = {};
  
  /** Base tabs array - filtered based on engagement level */
  private allTabs = [
    { label: 'My Activities', value: 'my-activities' },
    { label: 'My activities vs. top peers', value: 'top-peers' },
    { label: 'My activities vs. same engagement level characteristics', value: 'same-level' },
    { label: 'My activities vs. higher engagement level boundaries', value: 'higher-level' }
  ];

  /**
   * Get available tabs based on user's engagement level
   * Hides the 'higher-level' tab for users already at 'high' engagement level
   */
  get tabs() {
    // If user is at high engagement level, filter out the higher-level tab
    if (this.engagementLevel?.toLowerCase() === 'high') {
      return this.allTabs.filter(tab => tab.value !== 'higher-level');
    }
    return this.allTabs;
  }

  /** Collect all p-chart instances for refreshing on tab change */
  @ViewChildren(UIChart) charts!: QueryList<UIChart>;

  @ViewChild('annotationFilterPanel') annotationFilterPanel!: OverlayPanel;
  @ViewChild('materialFilterPanel') materialFilterPanel!: OverlayPanel;
  @ViewChild('accessFilterPanel') accessFilterPanel!: OverlayPanel;
  @ViewChild('kgFilterPanel') kgFilterPanel!: OverlayPanel;
  @ViewChild('recommendationFilterPanel') recommendationFilterPanel!: OverlayPanel;
  @ViewChild('categoryFilterPanel') categoryFilterPanel!: OverlayPanel;
  @ViewChild('peerCountPanel') peerCountPanel!: OverlayPanel;
  @ViewChild('sortingPanel') sortingPanel!: OverlayPanel;

  // Current chart for peer count selection
  currentPeerCountChart: string = '';

  // Sorting state
  sortOrder: 'none' | 'desc' | 'asc' = 'none'; // none = default order, desc = highest first, asc = lowest first
  sortedCharts: { chartName: string; title: string; totalValue: number; category: string }[] = [];

  annotationActivitiesExpanded: boolean = true;
  materialActivitiesExpanded: boolean = true;
  accessActivitiesExpanded: boolean = true;
  kgActivitiesExpanded: boolean = true;
  recommendationActivitiesExpanded: boolean = true;

  // Per-tab category visibility states - each tab has its own filter settings
  private tabCategoryVisibility: { [tabValue: string]: { [category: string]: boolean } } = {};
  
  // LocalStorage key for cross-course filter settings
  private readonly CROSS_COURSE_FILTERS_KEY = 'engagement_dashboard_cross_course_filters';
  
  // Enrolled courses for cross-course filter selection
  enrolledCourses: { _id: string; name: string; shortName?: string }[] = [];
  selectedCoursesForFilters: { [courseId: string]: boolean } = {};
  isLoadingEnrolledCourses: boolean = false;
  showCourseSelectionPanel: boolean = false;

  // Category visibility getters for current tab (for template binding)
  get materialActivitiesCategoryVisible(): boolean {
    return this.getCategoryVisibilityForCurrentTab('material');
  }
  get annotationActivitiesCategoryVisible(): boolean {
    return this.getCategoryVisibilityForCurrentTab('annotation');
  }
  get accessActivitiesCategoryVisible(): boolean {
    return this.getCategoryVisibilityForCurrentTab('access');
  }
  get kgActivitiesCategoryVisible(): boolean {
    return this.getCategoryVisibilityForCurrentTab('kg');
  }
  get recommendationActivitiesCategoryVisible(): boolean {
    return this.getCategoryVisibilityForCurrentTab('recommendation');
  }

  // Chart visibility states - Annotation
  addedAnnotationsVisible: boolean = true;
  annotationInteractionsVisible: boolean = true;
  likesDislikesVisible: boolean = true;
  tagsVisible: boolean = true;
  
  // Chart visibility states - Material
  pdfActivitiesVisible: boolean = true;
  videoActivitiesVisible: boolean = true;
  slidesAndVideoTimeVisible: boolean = true;
  
  // Chart visibility states - Access
  accessActivitiesVisible1: boolean = true;
  accessActivitiesVisible3: boolean = true;
  
  // Chart visibility states - KG
  kgActivitiesVisible1: boolean = true;
  kgActivitiesVisible2: boolean = true;
  kgActivitiesVisible3: boolean = true;
  
  // Chart visibility states - Recommendation
  recommendationActivitiesVisible2: boolean = true;
  recommendationActivitiesVisible3: boolean = true;

  // Maximized chart state
  maximizedChart: string | null = null;
  maximizedChartData: any = null;
  maximizedChartOptions: any = null;
  maximizedChartTitle: string = '';
  showMaximizedDialog: boolean = false;
  maximizedChartMaterialList: any[] = [];
  maximizedChartDeltaValues: any[] = [];

  // Top peers data
  peerActivitiesData: any[] = [];
  // Number of peers to compare for each chart (default 3)
  peerCounts: { [key: string]: number } = {};
  
  // Same engagement level statistics
  sameLevelStats: any = null;

  // Higher engagement level boundaries data
  higherLevelBoundaries: HigherLevelBoundariesResponse | null = null;

  // Math reference for use in templates
  Math = Math;

  // Annotation Activity Details (shown in maximized chart view)
  annotationDetailsLoading: boolean = false;
  annotationDetailsCategory: string = '';
  annotationDetailsData: AnnotationActivityDetail[] = [];
  annotationDetailsAllData: any = null;

  // KG Activity Details (shown in maximized chart view)
  kgDetailsLoading: boolean = false;
  kgDetailsCategory: string = '';
  kgDetailsData: KGActivityDetail[] = [];
  kgDetailsAllData: any = null;

  // Recommendation Activity Details (shown in maximized chart view)
  recommendationDetailsLoading: boolean = false;
  recommendationDetailsCategory: string = '';
  recommendationDetailsData: any[] = [];
  recommendationDetailsAllData: any = null;

  // Access Activity Details (shown in maximized chart view)
  accessDetailsLoading: boolean = false;
  accessDetailsCategory: string = '';
  accessDetailsData: AccessActivityDetail[] = [];
  accessDetailsAllData: AccessActivitiesResponse | null = null;
  accessDetailsSummary: {
    courseFrequency: AccessActivityFrequency[];
    topicFrequency: AccessActivityFrequency[];
    channelFrequency: AccessActivityFrequency[];
    materialFrequency: AccessActivityFrequency[];
    totals: { course: number; topic: number; channel: number; material: number };
  } | null = null;

  // Slides and Video Time Details (shown in maximized chart view)
  slidesAndVideoTimeDetails: {
    pdfSlides: { id: string; name: string; uniqueSlidesViewed: number; totalSlidesViewed: number; maxSlideViewed: number; totalSlides: number; lastAccessedSlide: number }[];
    videoTime: { id: string; name: string; timeInSeconds: number; timeInMinutes: number; lastAccessedTimestamp: number }[];
  } | null = null;

  toggleAnnotationActivities(): void {
    this.annotationActivitiesExpanded = !this.annotationActivitiesExpanded;
  }

  toggleMaterialActivities(): void {
    this.materialActivitiesExpanded = !this.materialActivitiesExpanded;
  }

  toggleAccessActivities(): void {
    this.accessActivitiesExpanded = !this.accessActivitiesExpanded;
  }

  toggleKgActivities(): void {
    this.kgActivitiesExpanded = !this.kgActivitiesExpanded;
  }

  toggleRecommendationActivities(): void {
    this.recommendationActivitiesExpanded = !this.recommendationActivitiesExpanded;
  }

  toggleChart(chartName: string): void {
    switch(chartName) {
      case 'addedAnnotations':
        this.addedAnnotationsVisible = !this.addedAnnotationsVisible;
        break;
      case 'annotationInteractions':
        this.annotationInteractionsVisible = !this.annotationInteractionsVisible;
        break;
      case 'likesDislikes':
        this.likesDislikesVisible = !this.likesDislikesVisible;
        break;
      case 'tags':
        this.tagsVisible = !this.tagsVisible;
        break;
      case 'pdfActivities':
        this.pdfActivitiesVisible = !this.pdfActivitiesVisible;
        break;
      case 'videoActivities':
        this.videoActivitiesVisible = !this.videoActivitiesVisible;
        break;
      case 'slidesAndVideoTime':
        this.slidesAndVideoTimeVisible = !this.slidesAndVideoTimeVisible;
        break;
      case 'accessActivities1':
        this.accessActivitiesVisible1 = !this.accessActivitiesVisible1;
        break;
      case 'accessActivities3':
        this.accessActivitiesVisible3 = !this.accessActivitiesVisible3;
        break;
      case 'kgActivities1':
        this.kgActivitiesVisible1 = !this.kgActivitiesVisible1;
        break;
      case 'kgActivities2':
        this.kgActivitiesVisible2 = !this.kgActivitiesVisible2;
        break;
      case 'kgActivities3':
        this.kgActivitiesVisible3 = !this.kgActivitiesVisible3;
        break;
      case 'recommendationActivities2':
        this.recommendationActivitiesVisible2 = !this.recommendationActivitiesVisible2;
        break;
      case 'recommendationActivities3':
        this.recommendationActivitiesVisible3 = !this.recommendationActivitiesVisible3;
        break;
    }
  }

  getHiddenChartsCount(): number {
    let count = 0;
    if (!this.addedAnnotationsVisible) count++;
    if (!this.annotationInteractionsVisible) count++;
    if (!this.likesDislikesVisible) count++;
    if (!this.tagsVisible) count++;
    if (!this.pdfActivitiesVisible) count++;
    if (!this.videoActivitiesVisible) count++;
    if (!this.slidesAndVideoTimeVisible) count++;
    if (!this.accessActivitiesVisible1) count++;
    if (!this.accessActivitiesVisible3) count++;
    if (!this.kgActivitiesVisible1) count++;
    if (!this.kgActivitiesVisible2) count++;
    if (!this.kgActivitiesVisible3) count++;
    if (!this.recommendationActivitiesVisible2) count++;
    if (!this.recommendationActivitiesVisible3) count++;
    return count;
  }

  showAllCharts(): void {
    this.addedAnnotationsVisible = true;
    this.annotationInteractionsVisible = true;
    this.likesDislikesVisible = true;
    this.tagsVisible = true;
    this.pdfActivitiesVisible = true;
    this.videoActivitiesVisible = true;
    this.slidesAndVideoTimeVisible = true;
    this.accessActivitiesVisible1 = true;
    this.accessActivitiesVisible3 = true;
    this.kgActivitiesVisible1 = true;
    this.kgActivitiesVisible2 = true;
    this.kgActivitiesVisible3 = true;
    this.recommendationActivitiesVisible2 = true;
    this.recommendationActivitiesVisible3 = true;
    this.showAllCategories();
  }

  openAnnotationFilter(event: Event): void {
    this.annotationFilterPanel.toggle(event);
  }

  openMaterialFilter(event: Event): void {
    this.materialFilterPanel.toggle(event);
  }

  openAccessFilter(event: Event): void {
    this.accessFilterPanel.toggle(event);
  }

  openKgFilter(event: Event): void {
    this.kgFilterPanel.toggle(event);
  }

  openRecommendationFilter(event: Event): void {
    this.recommendationFilterPanel.toggle(event);
  }

  openCategoryFilter(event: Event): void {
    this.categoryFilterPanel.toggle(event);
  }

  openSortingPanel(event: Event): void {
    this.sortingPanel.toggle(event);
  }

  /**
   * Set the sorting order for charts across all categories
   * @param order - 'none' for default order, 'desc' for highest first, 'asc' for lowest first
   */
  setSortOrder(order: 'none' | 'desc' | 'asc'): void {
    this.sortOrder = order;
    if (order !== 'none') {
      this.updateSortedCharts();
    }
  }

  /**
   * Get the total value for a chart by summing all data points in its dataset
   * @param chartName - The name of the chart
   * @returns The total value of all data points in the chart
   */
  private getChartTotalValue(chartName: string): number {
    const chartData = this.getChartData(chartName);
    if (!chartData || !chartData.datasets || !chartData.datasets[0] || !chartData.datasets[0].data) {
      return 0;
    }
    return chartData.datasets[0].data.reduce((sum: number, val: number) => sum + (val || 0), 0);
  }

  /**
   * Get all available charts with their metadata for sorting
   * @returns Array of chart info objects with name, title, total value, and category
   */
  private getAllChartsWithValues(): { chartName: string; title: string; totalValue: number; category: string }[] {
    const charts: { chartName: string; title: string; totalValue: number; category: string }[] = [];

    // Material Activities charts
    if (this.materialActivitiesCategoryVisible) {
      if (this.pdfActivitiesVisible) {
        charts.push({ chartName: 'pdfActivities', title: 'PDF related activities', totalValue: this.getChartTotalValue('pdfActivities'), category: 'material' });
      }
      if (this.videoActivitiesVisible) {
        charts.push({ chartName: 'videoActivities', title: 'Video related activities', totalValue: this.getChartTotalValue('videoActivities'), category: 'material' });
      }
      if (this.slidesAndVideoTimeVisible) {
        charts.push({ chartName: 'slidesAndVideoTime', title: 'Slides viewed & Video time', totalValue: this.getChartTotalValue('slidesAndVideoTime'), category: 'material' });
      }
    }

    // Annotation Activities charts
    if (this.annotationActivitiesCategoryVisible) {
      if (this.addedAnnotationsVisible) {
        charts.push({ chartName: 'addedAnnotations', title: 'Added annotations', totalValue: this.getChartTotalValue('addedAnnotations'), category: 'annotation' });
      }
      if (this.annotationInteractionsVisible) {
        charts.push({ chartName: 'annotationInteractions', title: 'Annotation interactions', totalValue: this.getChartTotalValue('annotationInteractions'), category: 'annotation' });
      }
      if (this.likesDislikesVisible) {
        charts.push({ chartName: 'likesDislikes', title: 'Likes/Dislikes', totalValue: this.getChartTotalValue('likesDislikes'), category: 'annotation' });
      }
      if (this.tagsVisible) {
        charts.push({ chartName: 'tags', title: 'Tags', totalValue: this.getChartTotalValue('tags'), category: 'annotation' });
      }
    }

    // Access Activities charts
    if (this.accessActivitiesCategoryVisible) {
      if (this.accessActivitiesVisible1) {
        charts.push({ chartName: 'accessActivities1', title: 'Access by type', totalValue: this.getChartTotalValue('accessActivities1'), category: 'access' });
      }
      if (this.accessActivitiesVisible3) {
        charts.push({ chartName: 'accessActivities3', title: 'Dashboard accesses', totalValue: this.getChartTotalValue('accessActivities3'), category: 'access' });
      }
    }

    // KG Activities charts
    if (this.kgActivitiesCategoryVisible) {
      if (this.kgActivitiesVisible1) {
        charts.push({ chartName: 'kgActivities1', title: 'KG Accesses & Views', totalValue: this.getChartTotalValue('kgActivities1'), category: 'kg' });
      }
      if (this.kgActivitiesVisible2) {
        charts.push({ chartName: 'kgActivities2', title: 'KG Concepts Marked', totalValue: this.getChartTotalValue('kgActivities2'), category: 'kg' });
      }
      if (this.kgActivitiesVisible3) {
        charts.push({ chartName: 'kgActivities3', title: 'Recommended Concepts', totalValue: this.getChartTotalValue('kgActivities3'), category: 'kg' });
      }
    }

    // Recommendation Activities charts
    if (this.recommendationActivitiesCategoryVisible) {
      if (this.recommendationActivitiesVisible2) {
        charts.push({ chartName: 'recommendationActivities2', title: 'Recommended Materials', totalValue: this.getChartTotalValue('recommendationActivities2'), category: 'recommendation' });
      }
      if (this.recommendationActivitiesVisible3) {
        charts.push({ chartName: 'recommendationActivities3', title: 'Recommended Concepts Marked', totalValue: this.getChartTotalValue('recommendationActivities3'), category: 'recommendation' });
      }
    }

    return charts;
  }

  /**
   * Update the sorted charts array based on current sort order
   */
  private updateSortedCharts(): void {
    const charts = this.getAllChartsWithValues();
    
    if (this.sortOrder === 'desc') {
      this.sortedCharts = charts.sort((a, b) => b.totalValue - a.totalValue);
    } else if (this.sortOrder === 'asc') {
      this.sortedCharts = charts.sort((a, b) => a.totalValue - b.totalValue);
    } else {
      this.sortedCharts = charts;
    }
  }

  /**
   * Check if sorting view is active
   */
  isSortingActive(): boolean {
    return this.sortOrder !== 'none';
  }

  /**
   * Clear sorting and return to default category-based view
   */
  clearSorting(): void {
    this.sortOrder = 'none';
    this.sortedCharts = [];
  }

  /**
   * Get the category display name for a chart
   */
  getCategoryDisplayName(category: string): string {
    const categoryNames: { [key: string]: string } = {
      'material': 'Material Activities',
      'annotation': 'Annotation Activities',
      'access': 'Access Activities',
      'kg': 'Knowledge Graph Activities',
      'recommendation': 'Recommendation Activities'
    };
    return categoryNames[category] || category;
  }

  /**
   * Get the sorting label for display
   */
  getSortOrderLabel(): string {
    if (this.sortOrder === 'desc') return 'Highest First';
    if (this.sortOrder === 'asc') return 'Lowest First';
    return 'Default';
  }

  /**
   * Initialize category visibility for a tab if not already set
   */
  private initializeTabCategoryVisibility(tabValue: string): void {
    if (!this.tabCategoryVisibility[tabValue]) {
      this.tabCategoryVisibility[tabValue] = {
        'material': true,
        'annotation': true,
        'access': true,
        'kg': true,
        'recommendation': true
      };
    }
  }

  /**
   * Get category visibility for the current tab
   */
  private getCategoryVisibilityForCurrentTab(category: string): boolean {
    this.initializeTabCategoryVisibility(this.currentTabValue);
    return this.tabCategoryVisibility[this.currentTabValue]?.[category] ?? true;
  }

  /**
   * Set category visibility for the current tab
   */
  private setCategoryVisibilityForCurrentTab(category: string, visible: boolean): void {
    this.initializeTabCategoryVisibility(this.currentTabValue);
    this.tabCategoryVisibility[this.currentTabValue][category] = visible;
  }

  toggleCategoryVisibility(category: string): void {
    const currentVisibility = this.getCategoryVisibilityForCurrentTab(category);
    this.setCategoryVisibilityForCurrentTab(category, !currentVisibility);
  }

  showAllCategories(): void {
    this.initializeTabCategoryVisibility(this.currentTabValue);
    this.tabCategoryVisibility[this.currentTabValue] = {
      'material': true,
      'annotation': true,
      'access': true,
      'kg': true,
      'recommendation': true
    };
  }

  getHiddenCategoriesCount(): number {
    let count = 0;
    if (!this.materialActivitiesCategoryVisible) count++;
    if (!this.annotationActivitiesCategoryVisible) count++;
    if (!this.accessActivitiesCategoryVisible) count++;
    if (!this.kgActivitiesCategoryVisible) count++;
    if (!this.recommendationActivitiesCategoryVisible) count++;
    return count;
  }

  /**
   * Apply current tab's category filters to all other courses
   * Saves filters to localStorage for cross-course persistence
   */
  applyFiltersToAllCourses(): void {
    // This method is now replaced by applyFiltersToSelectedCourses
    this.applyFiltersToSelectedCourses();
  }

  /**
   * Open course selection panel and load enrolled courses
   */
  openCourseSelectionPanel(): void {
    this.showCourseSelectionPanel = true;
    this.loadEnrolledCourses();
  }

  /**
   * Close course selection panel
   */
  closeCourseSelectionPanel(): void {
    this.showCourseSelectionPanel = false;
  }

  /**
   * Load user's enrolled courses
   */
  private loadEnrolledCourses(): void {
    if (this.enrolledCourses.length > 0) {
      // Already loaded
      return;
    }
    
    this.isLoadingEnrolledCourses = true;
    this.courseService.fetchCourses().subscribe({
      next: (courses) => {
        // Filter out the current course from the list
        this.enrolledCourses = courses
          .filter(course => course._id !== this.courseId)
          .map(course => ({
            _id: course._id,
            name: course.name,
            shortName: course.shortName
          }));
        
        // Initialize selection state for each course
        this.enrolledCourses.forEach(course => {
          if (this.selectedCoursesForFilters[course._id] === undefined) {
            this.selectedCoursesForFilters[course._id] = false;
          }
        });
        
        // Check if there are existing cross-course filters and pre-select those courses
        this.loadExistingCourseSelections();
        
        this.isLoadingEnrolledCourses = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading enrolled courses:', error);
        this.isLoadingEnrolledCourses = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Load existing course selections from localStorage
   */
  private loadExistingCourseSelections(): void {
    const stored = localStorage.getItem(this.CROSS_COURSE_FILTERS_KEY);
    if (stored) {
      try {
        const crossCourseFilters = JSON.parse(stored);
        if (crossCourseFilters.selectedCourseIds) {
          crossCourseFilters.selectedCourseIds.forEach((courseId: string) => {
            this.selectedCoursesForFilters[courseId] = true;
          });
        }
      } catch (e) {
        console.error('Error loading existing course selections:', e);
      }
    }
  }

  /**
   * Toggle course selection for filter application
   */
  toggleCourseSelection(courseId: string): void {
    this.selectedCoursesForFilters[courseId] = !this.selectedCoursesForFilters[courseId];
  }

  /**
   * Get count of selected courses
   */
  getSelectedCoursesCount(): number {
    return Object.values(this.selectedCoursesForFilters).filter(selected => selected).length;
  }

  /**
   * Apply current tab's category filters to selected courses
   */
  applyFiltersToSelectedCourses(): void {
    const selectedCourseIds = Object.entries(this.selectedCoursesForFilters)
      .filter(([_, selected]) => selected)
      .map(([courseId, _]) => courseId);
    
    if (selectedCourseIds.length === 0) {
      return;
    }
    
    this.initializeTabCategoryVisibility(this.currentTabValue);
    const currentFilters = this.tabCategoryVisibility[this.currentTabValue];
    
    // Save to localStorage for cross-course persistence
    const crossCourseFilters = {
      filters: currentFilters,
      selectedCourseIds: selectedCourseIds,
      appliedAt: new Date().toISOString(),
      sourceCourseId: this.courseId
    };
    localStorage.setItem(this.CROSS_COURSE_FILTERS_KEY, JSON.stringify(crossCourseFilters));
    this.showCourseSelectionPanel = false;
    this.cdr.detectChanges();
  }

  /**
   * Clear cross-course filter settings
   */
  clearCrossCourseFilters(): void {
    localStorage.removeItem(this.CROSS_COURSE_FILTERS_KEY);
    // Reset all course selections
    Object.keys(this.selectedCoursesForFilters).forEach(courseId => {
      this.selectedCoursesForFilters[courseId] = false;
    });
    this.cdr.detectChanges();
  }

  /**
   * Load cross-course filters from localStorage if available
   */
  private loadCrossCourseFilters(): void {
    const stored = localStorage.getItem(this.CROSS_COURSE_FILTERS_KEY);
    if (stored) {
      try {
        const crossCourseFilters = JSON.parse(stored);
        // Check if current course is in the selected courses list
        const selectedCourseIds: string[] = crossCourseFilters.selectedCourseIds || [];
        
        if (selectedCourseIds.includes(this.courseId) && crossCourseFilters.filters) {
          // Apply saved filters to all tabs for this course
          this.allTabs.forEach(tab => {
            this.tabCategoryVisibility[tab.value] = { ...crossCourseFilters.filters };
          });
        }
      } catch (e) {
        console.error('Error loading cross-course filters:', e);
      }
    }
  }

  /**
   * Check if cross-course filters are currently active for any course
   */
  hasCrossCourseFilters(): boolean {
    const stored = localStorage.getItem(this.CROSS_COURSE_FILTERS_KEY);
    if (stored) {
      try {
        const crossCourseFilters = JSON.parse(stored);
        const selectedCourseIds: string[] = crossCourseFilters.selectedCourseIds || [];
        return selectedCourseIds.length > 0;
      } catch (e) {
        return false;
      }
    }
    return false;
  }

  /**
   * Get list of course names where filters are applied
   */
  getAppliedFilterCourseNames(): string[] {
    const stored = localStorage.getItem(this.CROSS_COURSE_FILTERS_KEY);
    if (stored) {
      try {
        const crossCourseFilters = JSON.parse(stored);
        const selectedCourseIds: string[] = crossCourseFilters.selectedCourseIds || [];
        return this.enrolledCourses
          .filter(course => selectedCourseIds.includes(course._id))
          .map(course => course.name);
      } catch (e) {
        return [];
      }
    }
    return [];
  }

  maximizeChart(chartName: string): void {
    this.maximizedChart = chartName;
    const isTopPeers = this.isTopPeersTab();
    const isSameLevel = this.isSameLevelTab();
    const isHigherLevel = this.isHigherLevelTab();
    const isMyActivities = this.isMyActivitiesTab();
    const shouldShowMaterialList = !isTopPeers && !isSameLevel && !isHigherLevel;
    
    // Use getChartDataForTab to get appropriate data based on current tab
    this.maximizedChartData = this.getChartDataForTab(chartName);
    this.maximizedChartOptions = this.getChartOptions(chartName);
    
    // Get delta values based on current tab
    if (isTopPeers) {
      this.maximizedChartDeltaValues = this.getDeltaValuesForChart(chartName);
    } else if (isSameLevel) {
      this.maximizedChartDeltaValues = this.getDeltaValuesForSameLevelChart(chartName);
    } else if (isHigherLevel) {
      this.maximizedChartDeltaValues = this.getDeltaValuesForHigherLevelChart(chartName);
    } else {
      this.maximizedChartDeltaValues = [];
    }

    // Reset annotation details
    this.annotationDetailsData = [];
    this.annotationDetailsLoading = false;
    this.annotationDetailsCategory = '';

    // Reset KG details
    this.kgDetailsData = [];
    this.kgDetailsLoading = false;
    this.kgDetailsCategory = '';

    switch(chartName) {
      case 'addedAnnotations':
        this.maximizedChartTitle = 'Added annotations';
        this.maximizedChartMaterialList = [];
        if (isMyActivities) {
          this.annotationDetailsCategory = 'added';
          this.loadAnnotationDetailsForMaximizedChart('added');
        }
        break;
      case 'annotationInteractions':
        this.maximizedChartTitle = 'Total annotation interactions';
        this.maximizedChartMaterialList = [];
        if (isMyActivities) {
          this.annotationDetailsCategory = 'interactions';
          this.loadAnnotationDetailsForMaximizedChart('interactions');
        }
        break;
      case 'likesDislikes':
        this.maximizedChartTitle = 'Total number of likes/dislikes on annotations';
        this.maximizedChartMaterialList = [];
        if (isMyActivities) {
          this.annotationDetailsCategory = 'likesdislikes';
          this.loadAnnotationDetailsForMaximizedChart('likesdislikes');
        }
        break;
      case 'tags':
        this.maximizedChartTitle = 'Total tags added/viewed';
        this.maximizedChartMaterialList = [];
        if (isMyActivities) {
          this.annotationDetailsCategory = 'tags';
          this.loadAnnotationDetailsForMaximizedChart('tags');
        }
        break;
      case 'pdfActivities':
        this.maximizedChartTitle = 'PDF related activities';
        this.maximizedChartMaterialList = shouldShowMaterialList ? this.getPdfMaterialList() : [];
        break;
      case 'videoActivities':
        this.maximizedChartTitle = 'Video related activities';
        this.maximizedChartMaterialList = shouldShowMaterialList ? this.getVideoMaterialList() : [];
        break;
      case 'slidesAndVideoTime':
        this.maximizedChartTitle = 'Total slides viewed and time spent on videos (min)';
        this.maximizedChartMaterialList = [];
        // Load slides and video time details from engagement metrics
        if (isMyActivities && this.engagementMetrics?.slideAndVideoDetails) {
          this.slidesAndVideoTimeDetails = this.engagementMetrics.slideAndVideoDetails;
        } else {
          this.slidesAndVideoTimeDetails = null;
        }
        break;
      case 'accessActivities1':
        this.maximizedChartTitle = 'Access Activities by Type';
        this.maximizedChartMaterialList = [];
        if (isMyActivities) {
          this.accessDetailsCategory = 'all';
          this.loadAccessDetailsForMaximizedChart('all');
        }
        break;
      case 'accessActivities3':
        this.maximizedChartTitle = 'Dashboard Access Activities';
        this.maximizedChartMaterialList = [];
        break;
      case 'kgActivities1':
        this.maximizedChartTitle = 'Knowledge Graph Access & Views';
        this.maximizedChartMaterialList = [];
        if (isMyActivities) {
          this.kgDetailsCategory = 'summary';
          this.loadKGDetailsForMaximizedChart('summary');
        }
        break;
      case 'kgActivities2':
        this.maximizedChartTitle = 'Knowledge Graph Marked Activities';
        this.maximizedChartMaterialList = [];
        if (isMyActivities) {
          this.kgDetailsCategory = 'marked';
          this.loadKGDetailsForMaximizedChart('marked');
        }
        break;
      case 'kgActivities3':
        this.maximizedChartTitle = 'Knowledge Graph Summary';
        this.maximizedChartMaterialList = [];
        if (isMyActivities) {
          this.kgDetailsCategory = 'accesses';
          this.loadKGDetailsForMaximizedChart('accesses');
        }
        break;
      case 'recommendationActivities2':
        this.maximizedChartTitle = 'Recommended Materials';
        this.maximizedChartMaterialList = [];
        if (isMyActivities) {
          this.recommendationDetailsCategory = 'materials';
          this.loadRecommendationDetailsForMaximizedChart('materials');
        }
        break;
      case 'recommendationActivities3':
        this.maximizedChartTitle = 'Recommended Concepts Marked';
        this.maximizedChartMaterialList = [];
        if (isMyActivities) {
          this.recommendationDetailsCategory = 'concepts';
          this.loadRecommendationDetailsForMaximizedChart('concepts');
        }
        break;
    }
    this.showMaximizedDialog = true;
    
    // Refresh charts after dialog is shown to ensure proper sizing
    setTimeout(() => {
      this.cdr.detectChanges();
      this.refreshAllCharts();
    }, 50);
  }

  closeMaximizedChart(): void {
    this.showMaximizedDialog = false;
    this.maximizedChart = null;
    this.maximizedChartData = null;
    this.maximizedChartOptions = null;
    this.maximizedChartTitle = '';
    this.maximizedChartMaterialList = [];
    this.maximizedChartDeltaValues = [];
    // Reset annotation details when closing
    this.annotationDetailsData = [];
    this.annotationDetailsLoading = false;
    this.annotationDetailsCategory = '';
    this.annotationDetailsAllData = null;
    // Reset KG details when closing
    this.kgDetailsData = [];
    this.kgDetailsLoading = false;
    this.kgDetailsCategory = '';
    this.kgDetailsAllData = null;
    // Reset Recommendation details when closing
    this.recommendationDetailsData = [];
    this.recommendationDetailsLoading = false;
    this.recommendationDetailsCategory = '';
    this.recommendationDetailsAllData = null;
    // Reset Access details when closing
    this.accessDetailsData = [];
    this.accessDetailsLoading = false;
    this.accessDetailsCategory = '';
    this.accessDetailsAllData = null;
    this.accessDetailsSummary = null;
  }

  /**
   * Load annotation details for maximized chart view
   */
  private loadAnnotationDetailsForMaximizedChart(category: string): void {
    this.annotationDetailsLoading = true;
    this.annotationDetailsData = [];

    if (this.userId && this.courseId) {
      this.engagementService.getAnnotationActivityDetails(this.userId, this.courseId, category)
        .subscribe({
          next: (response) => {
            this.annotationDetailsAllData = response.activities;
            this.annotationDetailsData = this.getAnnotationDataForCategory(category, response.activities);
            this.annotationDetailsLoading = false;
          },
          error: (error) => {
            console.error('Error fetching annotation activity details:', error);
            this.annotationDetailsLoading = false;
            this.annotationDetailsData = [];
          }
        });
    } else {
      this.annotationDetailsLoading = false;
    }
  }

  /**
   * Load KG activity details for maximized chart view
   */
  private loadKGDetailsForMaximizedChart(category: string): void {
    this.kgDetailsLoading = true;
    this.kgDetailsData = [];

    if (this.userId && this.courseId) {
      this.engagementService.getKGActivityDetails(this.userId, this.courseId, category)
        .subscribe({
          next: (response) => {
            this.kgDetailsAllData = response.activities;
            this.kgDetailsData = this.getKGDataForCategory(category, response.activities);
            this.kgDetailsLoading = false;
          },
          error: (error) => {
            console.error('Error fetching KG activity details:', error);
            this.kgDetailsLoading = false;
            this.kgDetailsData = [];
          }
        });
    } else {
      this.kgDetailsLoading = false;
    }
  }

  /**
   * Check if the maximized chart is an annotation chart
   */
  isAnnotationChart(): boolean {
    return ['addedAnnotations', 'annotationInteractions', 'likesDislikes', 'tags'].includes(this.maximizedChart || '');
  }

  /**
   * Check if the maximized chart is a KG chart with details
   */
  isKGChartWithDetails(): boolean {
    return ['kgActivities1', 'kgActivities2', 'kgActivities3'].includes(this.maximizedChart || '');
  }

  /**
   * Check if the maximized chart is an access chart with details
   */
  isAccessChartWithDetails(): boolean {
    return this.maximizedChart === 'accessActivities1';
  }

  /**
   * Load access activity details for maximized chart view
   */
  private loadAccessDetailsForMaximizedChart(category: string): void {
    this.accessDetailsLoading = true;
    this.accessDetailsData = [];
    this.accessDetailsSummary = null;

    if (this.userId && this.courseId) {
      this.engagementService.getAccessActivityDetails(this.userId, this.courseId, category)
        .subscribe({
          next: (response) => {
            this.accessDetailsAllData = response;
            this.accessDetailsSummary = response.summary;
            this.accessDetailsData = this.getAccessDataForCategory(category, response.activities);
            this.accessDetailsLoading = false;
          },
          error: (error) => {
            console.error('Error fetching access activity details:', error);
            this.accessDetailsLoading = false;
            this.accessDetailsData = [];
            this.accessDetailsSummary = null;
          }
        });
    } else {
      this.accessDetailsLoading = false;
    }
  }

  /**
   * Get the data for a specific access category from the response
   */
  private getAccessDataForCategory(category: string, activities: any): AccessActivityDetail[] {
    switch (category) {
      case 'course': 
        return activities.courseAccesses || [];
      case 'topic': 
        return activities.topicAccesses || [];
      case 'channel': 
        return activities.channelAccesses || [];
      case 'material': 
        return activities.materialAccesses || [];
      case 'all':
      default: 
        // Combine all access types
        return [
          ...(activities.courseAccesses || []),
          ...(activities.topicAccesses || []),
          ...(activities.channelAccesses || []),
          ...(activities.materialAccesses || [])
        ];
    }
  }

  /**
   * Get badge class for access type
   */
  getAccessTypeBadgeClass(type: string): string {
    const normalizedType = type?.toLowerCase();
    switch (normalizedType) {
      case 'course': return 'bg-blue-100 text-blue-800';
      case 'topic': return 'bg-green-100 text-green-800';
      case 'channel': return 'bg-purple-100 text-purple-800';
      case 'pdf': return 'bg-orange-100 text-orange-800';
      case 'video': 
      case 'youtube': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get display name for access type
   */
  getAccessTypeDisplayName(type: string): string {
    const normalizedType = type?.toLowerCase();
    switch (normalizedType) {
      case 'course': return 'Course';
      case 'topic': return 'Topic';
      case 'channel': return 'Channel';
      case 'pdf': return 'PDF';
      case 'video': 
      case 'youtube': return 'Video';
      default: return type || 'Unknown';
    }
  }

  /**
   * Filter access details based on search input
   */
  filterAccessDetails(event: any): void {
    const filterValue = event.target.value?.toLowerCase() || '';
    if (!filterValue) {
      this.accessDetailsData = this.getAccessDataForCategory(this.accessDetailsCategory, this.accessDetailsAllData?.activities);
      return;
    }
    
    const allData = this.getAccessDataForCategory(this.accessDetailsCategory, this.accessDetailsAllData?.activities);
    this.accessDetailsData = allData.filter((item: AccessActivityDetail) => {
      return (item.objectName?.toLowerCase().includes(filterValue)) ||
             (item.type?.toLowerCase().includes(filterValue)) ||
             (item.courseName?.toLowerCase().includes(filterValue)) ||
             (item.topicName?.toLowerCase().includes(filterValue)) ||
             (item.channelName?.toLowerCase().includes(filterValue)) ||
             (item.materialName?.toLowerCase().includes(filterValue));
    });
  }

  /**
   * Get the data for a specific KG category from the response
   */
  private getKGDataForCategory(category: string, activities: any): KGActivityDetail[] {
    switch (category) {
      case 'summary': 
        // Combine accesses and concepts viewed for summary
        return [...(activities.kgAccesses || []), ...(activities.conceptsViewed || [])];
      case 'marked': 
        return activities.markedConcepts || [];
      case 'accesses':
        // Only KG accesses by location (Course, Material, Slide)
        return activities.kgAccesses || [];
      default: 
        return [];
    }
  }

  /**
   * Get label for the current KG details category
   */
  getKGDetailsCategoryLabel(): string {
    switch (this.kgDetailsCategory) {
      case 'summary': return 'Knowledge Graph Accesses & Concepts/Wiki Viewed';
      case 'marked': return 'Concepts Marked as Understood/Not Understood/New';
      case 'accesses': return 'Knowledge Graph Accesses by Location';
      default: return 'Knowledge Graph Activities';
    }
  }

  /**
   * Filter KG details based on search input
   */
  filterKGDetails(event: any): void {
    const filterValue = event.target.value?.toLowerCase() || '';
    if (!filterValue) {
      this.kgDetailsData = this.getKGDataForCategory(this.kgDetailsCategory, this.kgDetailsAllData);
      return;
    }
    
    const allData = this.getKGDataForCategory(this.kgDetailsCategory, this.kgDetailsAllData);
    this.kgDetailsData = allData.filter((item: KGActivityDetail) => {
      return (item.conceptName?.toLowerCase().includes(filterValue)) ||
             (item.verb?.toLowerCase().includes(filterValue)) ||
             (item.kgType?.toLowerCase().includes(filterValue)) ||
             (item.viewType?.toLowerCase().includes(filterValue)) ||
             (item.markType?.toLowerCase().includes(filterValue)) ||
             (item.materialName?.toLowerCase().includes(filterValue));
    });
  }

  /**
   * Get badge class for KG type
   */
  getKGTypeBadgeClass(kgType: string): string {
    switch (kgType) {
      case 'Course KG': return 'bg-purple-100 text-purple-800';
      case 'Material KG': return 'bg-blue-100 text-blue-800';
      case 'Slide KG': return 'bg-green-100 text-green-800';
      case 'Recommendation KG': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get badge class for mark type (U/DNU/New)
   */
  getMarkTypeBadgeClass(markType: string): string {
    switch (markType) {
      case 'Understood': return 'bg-green-100 text-green-800';
      case 'Did Not Understand': return 'bg-red-100 text-red-800';
      case 'New': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get icon for view type
   */
  getViewTypeIcon(viewType: string): string {
    switch (viewType) {
      case 'Concept': return 'pi-sitemap';
      case 'Wiki Article': return 'pi-book';
      case 'Visual Explanation': return 'pi-image';
      case 'Textual Explanation': return 'pi-file';
      default: return 'pi-circle';
    }
  }

  /**
   * Load recommendation activity details for maximized chart view
   */
  private loadRecommendationDetailsForMaximizedChart(category: string): void {
    this.recommendationDetailsLoading = true;
    this.recommendationDetailsData = [];

    if (this.userId && this.courseId) {
      this.engagementService.getRecommendationActivityDetails(this.userId, this.courseId, category)
        .subscribe({
          next: (response) => {
            this.recommendationDetailsAllData = response.activities;
            this.recommendationDetailsData = this.getRecommendationDataForCategory(category, response.activities);
            this.recommendationDetailsLoading = false;
          },
          error: (error) => {
            console.error('Error fetching recommendation activity details:', error);
            this.recommendationDetailsLoading = false;
            this.recommendationDetailsData = [];
          }
        });
    } else {
      this.recommendationDetailsLoading = false;
    }
  }

  /**
   * Check if the maximized chart is a recommendation chart with details
   */
  isRecommendationChartWithDetails(): boolean {
    return ['recommendationActivities2', 'recommendationActivities3'].includes(this.maximizedChart || '');
  }

  /**
   * Get the data for a specific recommendation category from the response
   */
  private getRecommendationDataForCategory(category: string, activities: any): any[] {
    switch (category) {
      case 'materials': 
        return activities.materialActivities || [];
      case 'concepts': 
        return activities.conceptActivities || [];
      default: 
        return [];
    }
  }

  /**
   * Get label for the current recommendation details category
   */
  getRecommendationDetailsCategoryLabel(): string {
    switch (this.recommendationDetailsCategory) {
      case 'materials': return 'Recommended Materials - Helpful/Not Helpful';
      case 'concepts': return 'Recommended Concepts - Understood/Did Not Understand/New';
      default: return 'Recommendation Activities';
    }
  }

  /**
   * Filter recommendation details based on search input
   */
  filterRecommendationDetails(event: any): void {
    const filterValue = event.target.value?.toLowerCase() || '';
    if (!filterValue) {
      this.recommendationDetailsData = this.getRecommendationDataForCategory(this.recommendationDetailsCategory, this.recommendationDetailsAllData);
      return;
    }
    
    const allData = this.getRecommendationDataForCategory(this.recommendationDetailsCategory, this.recommendationDetailsAllData);
    this.recommendationDetailsData = allData.filter((item: any) => {
      return (item.resourceName?.toLowerCase().includes(filterValue)) ||
             (item.conceptName?.toLowerCase().includes(filterValue)) ||
             (item.markType?.toLowerCase().includes(filterValue)) ||
             (item.resourceType?.toLowerCase().includes(filterValue)) ||
             (item.verb?.toLowerCase().includes(filterValue));
    });
  }

  /**
   * Get badge class for recommendation mark type (Helpful/Not Helpful)
   */
  getRecommendationMarkTypeBadgeClass(markType: string): string {
    switch (markType) {
      case 'Helpful': return 'bg-green-100 text-green-800';
      case 'Not Helpful': return 'bg-red-100 text-red-800';
      case 'Understood': return 'bg-green-100 text-green-800';
      case 'Did Not Understand': return 'bg-red-100 text-red-800';
      case 'New': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  /**
   * Get badge class for resource type (Article/Video)
   */
  getResourceTypeBadgeClass(resourceType: string): string {
    switch (resourceType) {
      case 'Article': return 'bg-blue-100 text-blue-800';
      case 'Video': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getPdfMaterialList(): any[] {
    if (!this.engagementMetrics?.materialDetails?.pdfs) {
      return [];
    }
    const pdfs = this.engagementMetrics.materialDetails.pdfs;
    return [
      {
        label: 'PDFs Started',
        items: pdfs.started || []
      },
      {
        label: 'PDFs Completed',
        items: pdfs.completed || []
      }
    ];
  }

  getVideoMaterialList(): any[] {
    if (!this.engagementMetrics?.materialDetails?.videos) {
      return [];
    }
    const videos = this.engagementMetrics.materialDetails.videos;
    return [
      {
        label: 'Videos Started',
        items: videos.started || []
      },
      {
        label: 'Videos Completed',
        items: videos.completed || []
      }
    ];
  }

  navigateToMaterial(material: MaterialDetail): void {
    if (material.type === 'pdf') {
      this.router.navigate([
        'course',
        material.courseId,
        'channel',
        material.channelId,
        'material',
        { outlets: { material: [material.id, 'pdf'] } }
      ]);
    } else if (material.type === 'video') {
      this.router.navigate([
        'course',
        material.courseId,
        'channel',
        material.channelId,
        'material',
        { outlets: { material: [material.id, 'video'] } }
      ]);
    }
  }

  /**
   * Navigate to a specific slide in a PDF
   * @param materialId The ID of the PDF material
   * @param slideNumber The slide number to navigate to (1-based)
   */
  navigateToPdfSlide(materialId: string, slideNumber: number): void {
    this.materialsService.getMaterialById(materialId).subscribe({
      next: (material) => {
        if (material) {
          // Set navigating flag
          this.courseService.navigatingToMaterial = true;

          const targetURL = `/course/${material.courseId}/channel/${material.channelId}/material/(material:${materialId}/pdf)`;
          this.router.navigateByUrl(targetURL);

          // Create an Annotation-like object for navigation to the specific slide
          const navigationAnnotation: any = {
            _id: `slide-${slideNumber}`,
            materialId: materialId,
            materialType: 'pdf',
            content: `Slide ${slideNumber}`,
            channelId: material.channelId,
            courseId: material.courseId,
            location: {
              type: 'Current Slide',
              startPage: slideNumber,
              lastPage: slideNumber,
            },
            annotationId: `slide-${slideNumber}`,
            startPage: slideNumber,
          };

          // Dispatch notification action to navigate to the specific slide
          this.store.dispatch(
            NotificationActions.setCurrentlySelectedFollowingAnnotation({
              followingAnnotation: navigationAnnotation,
            })
          );
        }
      },
      error: (err) => {
        console.error('Error fetching material for PDF navigation:', err);
      }
    });
  }

  /**
   * Navigate to a video at a specific timestamp
   * @param materialId The ID of the video material
   * @param timestampInSeconds The timestamp in seconds to seek to
   */
  navigateToVideo(materialId: string, timestampInSeconds: number): void {
    this.materialsService.getMaterialById(materialId).subscribe({
      next: (material) => {
        if (material) {
          const hours = Math.floor(timestampInSeconds / 3600);
          const minutes = Math.floor((timestampInSeconds % 3600) / 60);
          const seconds = Math.floor(timestampInSeconds % 60);
          
          const targetURL = `/course/${material.courseId}/channel/${material.channelId}/material/(material:${materialId}/video)`;
          this.router.navigateByUrl(targetURL).then(() => {
            // After navigation, seek to the timestamp
            setTimeout(() => {
              this.store.dispatch(VideoActions.SetSeekVideo({ seekVideo: [minutes, seconds] }));
              this.store.dispatch(VideoActions.SetCurrentTime({ currentTime: timestampInSeconds }));
            }, 200);
          });
        }
      },
      error: (err) => {
        console.error('Error fetching material for video navigation:', err);
      }
    });
  }

  /**
   * Format video timestamp from seconds to HH:MM:SS or MM:SS format
   * @param timestampInSeconds The timestamp in seconds
   * @returns Formatted time string
   */
  formatVideoTimestamp(timestampInSeconds: number): string {
    if (!timestampInSeconds || timestampInSeconds === 0) {
      return '0:00';
    }
    const hours = Math.floor(timestampInSeconds / 3600);
    const minutes = Math.floor((timestampInSeconds % 3600) / 60);
    const seconds = Math.floor(timestampInSeconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  toggleChartType(chartName: string): void {
    this.chartTypes[chartName] = this.chartTypes[chartName] === 'bar' ? 'pie' : 'bar';
    // Clear cache for this chart when toggling type to ensure fresh data
    const cacheKey = `${this.currentTabValue}_${chartName}`;
    delete this.chartDataCache[cacheKey];
    // Trigger change detection
    this.cdr.markForCheck();
  }

  getChartType(chartName: string): 'bar' | 'pie' {
    return this.chartTypes[chartName] || 'bar';
  }

  getChartData(chartName: string): any {
    const chartType = this.getChartType(chartName);
    if (chartType === 'pie') {
      switch(chartName) {
        case 'addedAnnotations': return this.addedAnnotationsPieData;
        case 'annotationInteractions': return this.annotationInteractionsPieData;
        case 'likesDislikes': return this.likesDislikesPieData;
        case 'tags': return this.tagsPieData;
        case 'pdfActivities': return this.pdfActivitiesPieData;
        case 'videoActivities': return this.videoActivitiesPieData;
        case 'slidesAndVideoTime': return this.slidesAndVideoTimePieData;
        case 'accessActivities1': return this.accessActivitiesPieData1;
        case 'accessActivities3': return this.accessActivitiesPieData3;
        case 'kgActivities1': return this.kgActivitiesPieData1;
        case 'kgActivities2': return this.kgActivitiesPieData2;
        case 'kgActivities3': return this.kgActivitiesPieData3;
        case 'recommendationActivities2': return this.recommendationActivitiesPieData2;
        case 'recommendationActivities3': return this.recommendationActivitiesPieData3;
        default: return null;
      }
    } else {
      switch(chartName) {
        case 'addedAnnotations': return this.addedAnnotationsData;
        case 'annotationInteractions': return this.annotationInteractionsData;
        case 'likesDislikes': return this.likesDislikesData;
        case 'tags': return this.tagsData;
        case 'pdfActivities': return this.pdfActivitiesData;
        case 'videoActivities': return this.videoActivitiesData;
        case 'slidesAndVideoTime': return this.slidesAndVideoTimeData;
        case 'accessActivities1': return this.accessActivitiesData1;
        case 'accessActivities3': return this.accessActivitiesData3;
        case 'kgActivities1': return this.kgActivitiesData1;
        case 'kgActivities2': return this.kgActivitiesData2;
        case 'kgActivities3': return this.kgActivitiesData3;
        case 'recommendationActivities2': return this.recommendationActivitiesData2;
        case 'recommendationActivities3': return this.recommendationActivitiesData3;
        default: return null;
      }
    }
  }

  getChartOptions(chartName: string): any {
    if (this.currentTabValue === 'top-peers') {
      return this.getTopPeersChartOptions(chartName);
    }
    if (this.currentTabValue === 'same-level') {
      return this.getSameLevelChartOptions(chartName);
    }
    if (this.currentTabValue === 'higher-level') {
      return this.getHigherLevelChartOptions(chartName);
    }

    const chartType = this.getChartType(chartName);
    if (chartType === 'pie') {
      switch(chartName) {
        case 'addedAnnotations': return this.addedAnnotationsPieOptions;
        case 'annotationInteractions': return this.annotationInteractionsPieOptions;
        case 'likesDislikes': return this.likesDislikesPieOptions;
        case 'tags': return this.tagsPieOptions;
        case 'pdfActivities': return this.pdfActivitiesPieOptions;
        case 'videoActivities': return this.videoActivitiesPieOptions;
        case 'slidesAndVideoTime': return this.slidesAndVideoTimePieOptions;
        case 'accessActivities1': return this.accessActivitiesPieOptions1;
        case 'accessActivities3': return this.accessActivitiesPieOptions3;
        case 'kgActivities1': return this.kgActivitiesPieOptions1;
        case 'kgActivities2': return this.kgActivitiesPieOptions2;
        case 'kgActivities3': return this.kgActivitiesPieOptions3;
        case 'recommendationActivities2': return this.recommendationActivitiesPieOptions2;
        case 'recommendationActivities3': return this.recommendationActivitiesPieOptions3;
        default: return null;
      }
    } else {
      switch(chartName) {
        case 'addedAnnotations': return this.addedAnnotationsOptions;
        case 'annotationInteractions': return this.annotationInteractionsOptions;
        case 'likesDislikes': return this.likesDislikesOptions;
        case 'tags': return this.tagsOptions;
        case 'pdfActivities': return this.pdfActivitiesOptions;
        case 'videoActivities': return this.videoActivitiesOptions;
        case 'slidesAndVideoTime': return this.slidesAndVideoTimeOptions;
        case 'accessActivities1': return this.accessActivitiesOptions1;
        case 'accessActivities3': return this.accessActivitiesOptions3;
        case 'kgActivities1': return this.kgActivitiesOptions1;
        case 'kgActivities2': return this.kgActivitiesOptions2;
        case 'kgActivities3': return this.kgActivitiesOptions3;
        case 'recommendationActivities2': return this.recommendationActivitiesOptions2;
        case 'recommendationActivities3': return this.recommendationActivitiesOptions3;
        default: return null;
      }
    }
  }

  /**
   * Get chart options for same engagement level tab
   */
  getSameLevelChartOptions(chartName: string): any {
    // Get base options from regular chart options
    const baseOptions = (() => {
      switch(chartName) {
        case 'addedAnnotations': return this.addedAnnotationsOptions;
        case 'annotationInteractions': return this.annotationInteractionsOptions;
        case 'likesDislikes': return this.likesDislikesOptions;
        case 'tags': return this.tagsOptions;
        case 'pdfActivities': return this.pdfActivitiesOptions;
        case 'videoActivities': return this.videoActivitiesOptions;
        case 'slidesAndVideoTime': return this.slidesAndVideoTimeOptions;
        case 'accessActivities1': return this.accessActivitiesOptions1;
        case 'accessActivities3': return this.accessActivitiesOptions3;
        case 'kgActivities1': return this.kgActivitiesOptions1;
        case 'kgActivities2': return this.kgActivitiesOptions2;
        case 'kgActivities3': return this.kgActivitiesOptions3;
        case 'recommendationActivities2': return this.recommendationActivitiesOptions2;
        case 'recommendationActivities3': return this.recommendationActivitiesOptions3;
        default: return this.createDefaultChartOptions('Chart');
      }
    })();

    // Check if this chart uses multi-metric mapping (grouped bars)
    const multiMetricMapping = this.getMultiMetricMappingForChart(chartName);
    const isGroupedChart = !!multiMetricMapping;

    return {
      ...baseOptions,
      plugins: {
        ...baseOptions.plugins,
        legend: {
          display: true, // Always show legend for same-level tab
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 11
            },
            // For grouped charts, use dataset labels (You, Average, Maximum)
            // For single charts, generate custom legend items
            generateLabels: isGroupedChart ? undefined : (chart: any) => {
              return [
                { text: 'You', fillStyle: '#3b82f6', strokeStyle: '#3b82f6', lineWidth: 0 },
                { text: 'Average of all users', fillStyle: '#10b981', strokeStyle: '#10b981', lineWidth: 0 },
                { text: 'Maximum user activity', fillStyle: '#f59e0b', strokeStyle: '#f59e0b', lineWidth: 0 }
              ];
            }
          }
        },
        tooltip: {
          ...baseOptions.plugins?.tooltip,
          callbacks: {
            ...baseOptions.plugins?.tooltip?.callbacks,
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y || 0;
              
              // For grouped charts, dataset label already contains You/Average/Maximum
              if (isGroupedChart) {
                return `${label}: ${value}`;
              }
              
              // For single metric charts, use index to determine the label
              const index = context.dataIndex;
              if (index === 0) {
                return `${label}: ${value}`;
              } else if (index === 1) {
                return `${label} (Average): ${value}`;
              } else if (index === 2) {
                return `${label} (Maximum): ${value}`;
              }
              return `${label}: ${value}`;
            }
          }
        }
      }
    };
  }

  /**
   * Get chart options for higher engagement level boundaries tab
   * Shows user's value vs minimum boundary from the next higher engagement level
   */
  getHigherLevelChartOptions(chartName: string): any {
    // Get base options from regular chart options
    const baseOptions = (() => {
      switch(chartName) {
        case 'addedAnnotations': return this.addedAnnotationsOptions;
        case 'annotationInteractions': return this.annotationInteractionsOptions;
        case 'likesDislikes': return this.likesDislikesOptions;
        case 'tags': return this.tagsOptions;
        case 'pdfActivities': return this.pdfActivitiesOptions;
        case 'videoActivities': return this.videoActivitiesOptions;
        case 'slidesAndVideoTime': return this.slidesAndVideoTimeOptions;
        case 'accessActivities1': return this.accessActivitiesOptions1;
        case 'accessActivities3': return this.accessActivitiesOptions3;
        case 'kgActivities1': return this.kgActivitiesOptions1;
        case 'kgActivities2': return this.kgActivitiesOptions2;
        case 'kgActivities3': return this.kgActivitiesOptions3;
        case 'recommendationActivities2': return this.recommendationActivitiesOptions2;
        case 'recommendationActivities3': return this.recommendationActivitiesOptions3;
        default: return this.createDefaultChartOptions('Chart');
      }
    })();

    const higherLevel = this.higherLevelBoundaries?.higherLevel || 'Higher';
    const higherLevelCapitalized = higherLevel.charAt(0).toUpperCase() + higherLevel.slice(1);

    // Check if this chart uses multi-metric mapping (grouped bars)
    const multiMetricMapping = this.getMultiMetricMappingForChart(chartName);
    const isGroupedChart = !!multiMetricMapping;

    return {
      ...baseOptions,
      plugins: {
        ...baseOptions.plugins,
        legend: {
          display: true, // Always show legend for higher-level tab
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 15,
            font: {
              size: 11
            },
            // For grouped charts, use dataset labels (You, Higher Level Threshold)
            // For single charts, generate custom legend items
            generateLabels: isGroupedChart ? undefined : (chart: any) => {
              return [
                { text: 'You', fillStyle: '#3b82f6', strokeStyle: '#3b82f6', lineWidth: 0 },
                { text: `${higherLevelCapitalized} Level Threshold`, fillStyle: '#8b5cf6', strokeStyle: '#8b5cf6', lineWidth: 0 }
              ];
            }
          }
        },
        tooltip: {
          ...baseOptions.plugins?.tooltip,
          callbacks: {
            ...baseOptions.plugins?.tooltip?.callbacks,
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y || 0;
              
              // For grouped charts, dataset label already contains You/Higher Level Minimum
              if (isGroupedChart) {
                return `${label}: ${value}`;
              }
              
              // For single metric charts, use index to determine the label
              const index = context.dataIndex;
              if (index === 0) {
                return `Your Value: ${value}`;
              } else if (index === 1) {
                return `${higherLevelCapitalized} Level Threshold: ${value}`;
              }
              return `${label}: ${value}`;
            },
            afterLabel: (context: any) => {
              const index = context.dataIndex;
              if (index === 0 && !isGroupedChart) {
                const chartData = this.getChartDataForTab(chartName);
                if (chartData?.datasets?.[0]?.data) {
                  const userValue = chartData.datasets[0].data[0] || 0;
                  const boundaryValue = chartData.datasets[0].data[1] || 0;
                  const difference = boundaryValue - userValue;
                  if (difference > 0) {
                    return `Gap to next level: +${difference}`;
                  } else if (difference < 0) {
                    return `Above boundary by: ${Math.abs(difference)}`;
                  }
                }
              }
              return '';
            }
          }
        }
      }
    };
  }

  /**
   * Get chart options for top peers tab with delta values
   */
  getTopPeersChartOptions(chartName: string): any {
    // Get base options from regular chart options
    const baseOptions = (() => {
      switch(chartName) {
        case 'addedAnnotations': return this.addedAnnotationsOptions;
        case 'annotationInteractions': return this.annotationInteractionsOptions;
        case 'likesDislikes': return this.likesDislikesOptions;
        case 'tags': return this.tagsOptions;
        case 'pdfActivities': return this.pdfActivitiesOptions;
        case 'videoActivities': return this.videoActivitiesOptions;
        case 'slidesAndVideoTime': return this.slidesAndVideoTimeOptions;
        case 'accessActivities1': return this.accessActivitiesOptions1;
        case 'accessActivities3': return this.accessActivitiesOptions3;
        case 'kgActivities1': return this.kgActivitiesOptions1;
        case 'kgActivities2': return this.kgActivitiesOptions2;
        case 'kgActivities3': return this.kgActivitiesOptions3;
        case 'recommendationActivities2': return this.recommendationActivitiesOptions2;
        case 'recommendationActivities3': return this.recommendationActivitiesOptions3;
        default: return this.createDefaultChartOptions('Chart');
      }
    })();

    // Use cached chart data to get delta values (avoid recalculation)
    const chartData = this.getChartDataForTab(chartName);
    
    if (!chartData || !chartData.datasets || !chartData.datasets[0]) {
      return baseOptions;
    }

    // Check if this is a grouped bar chart (multiple datasets for You + peers)
    const isGroupedChart = chartData.isGroupedChart === true;

    if (isGroupedChart) {
      // Return options for grouped bar chart with legend
      // X-axis shows participants (You, peers), legend shows activities/metrics
      return {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 11
              }
            }
          },
          tooltip: {
            ...baseOptions.plugins?.tooltip,
            callbacks: {
              ...baseOptions.plugins?.tooltip?.callbacks,
              label: (context: any) => {
                const activityLabel = context.dataset.label || '';
                const value = context.parsed.y || 0;
                const dataIndex = context.dataIndex; // Index of participant (0 = You)
                const deltaValues = context.dataset.deltaValues || [];
                const delta = deltaValues[dataIndex];
                
                // User (first x-axis position, dataIndex 0) has no delta
                if (dataIndex === 0) {
                  return `${activityLabel}: ${value}`;
                } else if (delta !== undefined) {
                  const deltaSign = delta >= 0 ? '+' : '';
                  return `${activityLabel}: ${value} (difference with you ${deltaSign}${delta})`;
                }
                return `${activityLabel}: ${value}`;
              }
            }
          }
        },
        scales: {
          ...baseOptions.scales,
          x: {
            ...baseOptions.scales?.x,
            categoryPercentage: 0.8,
            barPercentage: 0.9
          }
        },
        // Disable animations for faster rendering
        animation: {
          duration: 300
        },
        // Ensure responsive behavior
        responsive: true,
        maintainAspectRatio: false
      };
    }

    // Original single-dataset handling (fallback for charts without multi-metric mapping)
    // Cache delta values directly from chart data to avoid recalculation
    const deltaValues = chartData.datasets[0].deltaValues || [];

    // Create options with tooltip showing delta values
    return {
      ...baseOptions,
      plugins: {
        ...baseOptions.plugins,
        tooltip: {
          ...baseOptions.plugins?.tooltip,
          callbacks: {
            ...baseOptions.plugins?.tooltip?.callbacks,
            label: (context: any) => {
              const label = context.dataset.label || '';
              const value = context.parsed.y || 0;
              const index = context.dataIndex;
              const delta = deltaValues[index];
              
              if (index === 0) {
                return `${label}: ${value}`;
              } else if (delta !== undefined) {
                const deltaSign = delta >= 0 ? '+' : '';
                return `${label}: ${value} (Δ ${deltaSign}${delta})`;
              }
              return `${label}: ${value}`;
            }
          }
        }
      },
      // Disable animations for faster rendering
      animation: {
        duration: 300
      },
      // Ensure responsive behavior
      responsive: true,
      maintainAspectRatio: false
    };
  }

  // Chart type state (bar or pie) for each chart
  chartTypes: { [key: string]: 'bar' | 'pie' } = {
    addedAnnotations: 'bar',
    annotationInteractions: 'bar',
    likesDislikes: 'bar',
    tags: 'bar',
    pdfActivities: 'bar',
    videoActivities: 'bar',
    slidesAndVideoTime: 'bar',
    accessActivities1: 'bar',
    accessActivities3: 'bar',
    kgActivities1: 'bar',
    kgActivities2: 'bar',
    kgActivities3: 'bar',
    recommendationActivities2: 'bar',
    recommendationActivities3: 'bar'
  };

  // Chart data for Annotation Activities
  likesDislikesData: any;
  likesDislikesOptions: any;
  likesDislikesPieData: any;
  likesDislikesPieOptions: any;

  addedAnnotationsData: any;
  addedAnnotationsOptions: any;
  addedAnnotationsPieData: any;
  addedAnnotationsPieOptions: any;

  annotationInteractionsData: any;
  annotationInteractionsOptions: any;
  annotationInteractionsPieData: any;
  annotationInteractionsPieOptions: any;

  tagsData: any;
  tagsOptions: any;
  tagsPieData: any;
  tagsPieOptions: any;

  // Chart data for Material Activities
  pdfActivitiesData: any;
  pdfActivitiesOptions: any;
  pdfActivitiesPieData: any;
  pdfActivitiesPieOptions: any;

  videoActivitiesData: any;
  videoActivitiesOptions: any;
  videoActivitiesPieData: any;
  videoActivitiesPieOptions: any;

  slidesAndVideoTimeData: any;
  slidesAndVideoTimeOptions: any;
  slidesAndVideoTimePieData: any;
  slidesAndVideoTimePieOptions: any;

  // Chart data for Access Activities
  accessActivitiesData1: any;
  accessActivitiesOptions1: any;
  accessActivitiesPieData1: any;
  accessActivitiesPieOptions1: any;
  accessActivitiesData3: any;
  accessActivitiesOptions3: any;
  accessActivitiesPieData3: any;
  accessActivitiesPieOptions3: any;

  // Chart data for KG Activities
  kgActivitiesData1: any;
  kgActivitiesOptions1: any;
  kgActivitiesPieData1: any;
  kgActivitiesPieOptions1: any;
  kgActivitiesData2: any;
  kgActivitiesOptions2: any;
  kgActivitiesPieData2: any;
  kgActivitiesPieOptions2: any;
  kgActivitiesData3: any;
  kgActivitiesOptions3: any;
  kgActivitiesPieData3: any;
  kgActivitiesPieOptions3: any;

  // Chart data for Recommendation Activities
  recommendationActivitiesData2: any;
  recommendationActivitiesOptions2: any;
  recommendationActivitiesPieData2: any;
  recommendationActivitiesPieOptions2: any;
  recommendationActivitiesData3: any;
  recommendationActivitiesOptions3: any;
  recommendationActivitiesPieData3: any;
  recommendationActivitiesPieOptions3: any;

  // Gauge chart data
  gaugeData: any;
  gaugeOptions: any;

  constructor(
    private router: Router,
    private engagementService: EngagementService,
    private cdr: ChangeDetectorRef,
    private store: Store,
    private materialsService: MaterilasService,
    private courseService: CourseService
  ) {
    // Initialize peer counts to 3 for all charts
    const chartNames = [
      'addedAnnotations', 'annotationInteractions', 'likesDislikes', 'tags',
      'pdfActivities', 'videoActivities', 'slidesAndVideoTime',
      'accessActivities1', 'accessActivities3',
      'kgActivities1', 'kgActivities2', 'kgActivities3',
      'recommendationActivities2', 'recommendationActivities3'
    ];
    chartNames.forEach(name => {
      this.peerCounts[name] = 3;
    });
  }

  ngOnInit(): void {
    // Initialize the cached tab value based on activeTabIndex
    this.currentTabValue = this.tabs[this.activeTabIndex]?.value || 'my-activities';
    // Load cross-course filters from localStorage if available
    this.loadCrossCourseFilters();
    // Initialize category visibility for current tab
    this.initializeTabCategoryVisibility(this.currentTabValue);
    this.initializeCharts();
    this.initializePieCharts();
    this.initializeGauge();
    this.loadPeerActivities();
    this.loadSameLevelStats();
    this.loadHigherLevelBoundaries();
  }

  ngAfterViewInit(): void {
    // Refresh charts after the view is fully initialized
    // This ensures charts are properly sized when first loaded
    setTimeout(() => {
      this.refreshAllCharts();
      this.cdr.detectChanges();
    }, 100);
  }

  /**
   * Load peer activities data from the backend for the current course
   * Fetches activity metrics for all users enrolled in the course from the CSV file
   */
  private loadPeerActivities(): void {
    if (!this.courseId) {
      console.warn('Cannot load peer activities: courseId is not set');
      this.peerActivitiesData = [];
      return;
    }
    
    this.engagementService.getPeerActivities(this.courseId).subscribe({
      next: (data) => {
        this.peerActivitiesData = Array.isArray(data) ? data : [];
        console.log(`Loaded ${this.peerActivitiesData.length} peer activities for course ${this.courseId}`);
        // Invalidate chart cache when peer data is loaded
        this.chartDataCache = {};
        this.updateTopPeersCharts();
        // Trigger change detection to refresh charts
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading peer activities:', error);
        this.peerActivitiesData = [];
      }
    });
  }

  /**
   * Load same engagement level statistics from the backend
   */
  private loadSameLevelStats(): void {
    if (!this.userId || !this.courseId) {
      console.log('loadSameLevelStats: Missing userId or courseId', { userId: this.userId, courseId: this.courseId });
      return;
    }
    
    console.log(`loadSameLevelStats: Fetching stats for user ${this.userId}, course ${this.courseId}`);
    this.engagementService.getSameEngagementLevelStats(this.userId, this.courseId).subscribe({
      next: (data) => {
        console.log('loadSameLevelStats: Received data:', data);
        console.log('loadSameLevelStats: Statistics:', data?.statistics);
        console.log('loadSameLevelStats: Peer count:', data?.sameLevelStats?.peerCount);
        this.sameLevelStats = data;
        // Force chart refresh when data is loaded
        this.chartDataCache = {};
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading same engagement level statistics:', error);
        this.sameLevelStats = null;
      }
    });
  }

  /**
   * Load higher engagement level boundaries from the backend
   * Used for "My Activities vs. Higher Engagement Level Boundaries" tab
   * Fetches minimum values from users in the next higher engagement level
   */
  private loadHigherLevelBoundaries(): void {
    if (!this.userId || !this.courseId) {
      console.log('loadHigherLevelBoundaries: Missing userId or courseId', { userId: this.userId, courseId: this.courseId });
      return;
    }

    // Skip loading if user is already at highest level
    if (this.engagementLevel?.toLowerCase() === 'high') {
      console.log('loadHigherLevelBoundaries: User is at highest level, skipping');
      this.higherLevelBoundaries = null;
      return;
    }
    
    console.log(`loadHigherLevelBoundaries: Fetching boundaries for user ${this.userId}, course ${this.courseId}`);
    this.engagementService.getHigherEngagementLevelBoundaries(this.userId, this.courseId).subscribe({
      next: (data) => {
        console.log('loadHigherLevelBoundaries: Received data:', data);
        console.log('loadHigherLevelBoundaries: Boundaries:', data?.boundaries);
        console.log('loadHigherLevelBoundaries: Higher level:', data?.higherLevel);
        this.higherLevelBoundaries = data;
        // Force chart refresh when data is loaded
        this.chartDataCache = {};
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Error loading higher engagement level boundaries:', error);
        this.higherLevelBoundaries = null;
      }
    });
  }

  /**
   * Update charts for top peers tab
   * Triggers change detection to refresh chart display
   */
  private updateTopPeersCharts(): void {
    // Force a re-render of charts when data changes
    this.cdr.detectChanges();
  }

  /** Resize timeout for debouncing window resize events */
  private resizeTimeout: any;

  /**
   * Handle window resize to trigger chart re-render
   * Debounced to prevent excessive re-renders during resize
   */
  @HostListener('window:resize')
  onWindowResize(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
    this.resizeTimeout = setTimeout(() => {
      // Invalidate chart cache on resize
      this.chartDataCache = {};
      this.cdr.detectChanges();
    }, 150);
  }

  ngOnDestroy(): void {
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['engagementMetrics'] && this.engagementMetrics) {
      // Ensure pie charts are initialized before updating data
      if (!this.addedAnnotationsPieData) {
        this.initializePieCharts();
      }
      this.updateChartsWithData();
    }
    if (changes['engagementLevel']) {
      this.initializeGauge();
      // Reload higher level boundaries when engagement level changes
      // (in case user moved to 'high' level, the tab should be hidden)
      this.loadHigherLevelBoundaries();
    }
    if (changes['userId'] || changes['courseId']) {
      this.loadSameLevelStats();
      this.loadHigherLevelBoundaries();
      // Reload peer activities when course changes
      if (changes['courseId']) {
        this.loadPeerActivities();
      }
    }
  }

  private updateChartsWithData(): void {
    if (!this.engagementMetrics || !this.engagementMetrics.metrics) {
      return;
    }

    // Ensure pie charts are initialized before updating
    if (!this.addedAnnotationsPieData) {
      this.initializePieCharts();
    }

    const metrics = this.engagementMetrics.metrics;

    // Update annotation charts
    this.updateAnnotationCharts(metrics);
    
    // Update material charts
    this.updateMaterialCharts(metrics);
    
    // Update access, KG, and recommendation charts
    this.updateAccessCharts(metrics);
    this.updateKgCharts(metrics);
    this.updateRecommendationCharts(metrics);
  }

  private updateAnnotationCharts(metrics: any): void {
    // Update Added Annotations chart
    if (this.addedAnnotationsData) {
      const data = [
        metrics.annotations.question || 0,
        metrics.annotations.note || 0,
        metrics.annotations.externalResource || 0
      ];
      this.addedAnnotationsData = {
        ...this.addedAnnotationsData,
        datasets: [{
          ...this.addedAnnotationsData.datasets[0],
          data: data
        }]
      };
      // Update pie chart data - always update if bar chart exists
      this.addedAnnotationsPieData = {
        labels: this.addedAnnotationsData.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] // Red, Blue, Yellow - highly distinct
        }]
      };
    }

    // Update Annotation Interactions chart
    if (this.annotationInteractionsData) {
      const data = [
        metrics.totalAnnotationsFollowed || 0,
        metrics.totalUserMentionedRepliedActivities || 0,
        metrics.totalAnnotationsReplied || 0
      ];
      this.annotationInteractionsData = {
        ...this.annotationInteractionsData,
        datasets: [{
          ...this.annotationInteractionsData.datasets[0],
          data: data
        }]
      };
      // Update pie chart data - always update if bar chart exists
      this.annotationInteractionsPieData = {
        labels: this.annotationInteractionsData.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#9966FF', '#FF9F40', '#4BC0C0'] // Purple, Orange, Teal - highly distinct
        }]
      };
    }

    // Update Likes/Dislikes chart
    if (this.likesDislikesData) {
      const likesData = [
        metrics.likes.question || 0,
        metrics.likes.note || 0,
        metrics.likes.externalResource || 0
      ];
      const dislikesData = [
        metrics.dislikes.question || 0,
        metrics.dislikes.note || 0,
        metrics.dislikes.externalResource || 0
      ];
      this.likesDislikesData = {
        ...this.likesDislikesData,
        datasets: [
          {
            ...this.likesDislikesData.datasets[0],
            data: likesData
          },
          {
            ...this.likesDislikesData.datasets[1],
            data: dislikesData
          }
        ]
      };
      // Update pie chart data (show likes and dislikes separately) - always update if bar chart exists
      const allData = [...likesData, ...dislikesData];
      this.likesDislikesPieData = {
        labels: [
          'Likes - Question', 'Likes - Note', 'Likes - External Resource',
          'Dislikes - Question', 'Dislikes - Note', 'Dislikes - External Resource'
        ],
        datasets: [{
          data: allData,
          backgroundColor: [
            '#36A2EB', '#4BC0C0', '#9966FF', // Blue, Teal, Purple for likes
            '#FF6384', '#FF9F40', '#FFCE56'  // Red, Orange, Yellow for dislikes
          ]
        }]
      };
    }

    // Update Tags chart
    if (this.tagsData) {
      const data = [
        metrics.totalAddedTags || 0,
        metrics.totalTagViewed || 0
      ];
      this.tagsData = {
        ...this.tagsData,
        datasets: [{
          ...this.tagsData.datasets[0],
          data: data
        }]
      };
      // Update pie chart data - always update if bar chart exists
      this.tagsPieData = {
        labels: this.tagsData.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#FF6384', '#36A2EB'] // Red, Blue - highly distinct
        }]
      };
    }
  }

  private updateMaterialCharts(metrics: any): void {
    // Update PDF Activities chart
    if (this.pdfActivitiesData) {
      const data = [
        metrics.pdfStarted || 0,
        metrics.pdfCompleted || 0
      ];
      this.pdfActivitiesData = {
        ...this.pdfActivitiesData,
        datasets: [{
          ...this.pdfActivitiesData.datasets[0],
          data: data
        }]
      };
      // Update pie chart data - always update if bar chart exists
      this.pdfActivitiesPieData = {
        labels: this.pdfActivitiesData.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#36A2EB', '#FF6384'] // Blue, Red - highly distinct
        }]
      };
    }

    // Update Video Activities chart
    if (this.videoActivitiesData) {
      const data = [
        metrics.videosStarted || 0,
        metrics.videosCompleted || 0
      ];
      this.videoActivitiesData = {
        ...this.videoActivitiesData,
        datasets: [{
          ...this.videoActivitiesData.datasets[0],
          data: data
        }]
      };
      // Update pie chart data - always update if bar chart exists
      this.videoActivitiesPieData = {
        labels: this.videoActivitiesData.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#FFCE56', '#9966FF'] // Yellow, Purple - highly distinct
        }]
      };
    }

    // Update Slides and Video Time chart
    if (this.slidesAndVideoTimeData) {
      // Convert time spent on videos from seconds to minutes for display
      const timeSpentInMinutes = Math.round((metrics.timeSpentOnVideos || 0) / 60);
      const data = [
        metrics.slidesViewed || 0,
        timeSpentInMinutes
      ];
      this.slidesAndVideoTimeData = {
        ...this.slidesAndVideoTimeData,
        datasets: [{
          ...this.slidesAndVideoTimeData.datasets[0],
          data: data
        }]
      };
      // Update pie chart data - always update if bar chart exists
      this.slidesAndVideoTimePieData = {
        labels: this.slidesAndVideoTimeData.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#FF9F40', '#4BC0C0'] // Orange, Teal - highly distinct
        }]
      };
    }
  }

  private updateAccessCharts(metrics: any): void {
    // Update Access Activities chart 1
    if (this.accessActivitiesData1) {
      const data = [
        metrics.courseAccesses || 0,
        metrics.topicAccesses || 0,
        metrics.channelAccesses || 0,
        metrics.materialAccesses || 0
      ];
      this.accessActivitiesData1 = {
        ...this.accessActivitiesData1,
        datasets: [{
          ...this.accessActivitiesData1.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.accessActivitiesPieData1 = {
        labels: this.accessActivitiesData1.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'] // Red, Blue, Yellow, Teal - highly distinct
        }]
      };
    }

    // Update Access Activities chart 3
    if (this.accessActivitiesData3) {
      const data = [
        metrics.dashboardCourseAccesses || 0,
        metrics.dashboardTopicAccesses || 0,
        metrics.dashboardChannelAccesses || 0,
        metrics.dashboardMaterialAccesses || 0
      ];
      this.accessActivitiesData3 = {
        ...this.accessActivitiesData3,
        datasets: [{
          ...this.accessActivitiesData3.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.accessActivitiesPieData3 = {
        labels: this.accessActivitiesData3.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#9966FF', '#FF9F40', '#4BC0C0', '#FF6384'] // Purple, Orange, Teal, Red - highly distinct
        }]
      };
    }
  }

  private updateKgCharts(metrics: any): void {
    // Update KG Activities chart 1 - Summary
    if (this.kgActivitiesData1) {
      const data = [
        metrics.totalKnowledgeGraphAccesses || 0,
        metrics.totalKnowledgeGraphConceptViewed || 0
      ];
      this.kgActivitiesData1 = {
        ...this.kgActivitiesData1,
        datasets: [{
          ...this.kgActivitiesData1.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.kgActivitiesPieData1 = {
        labels: this.kgActivitiesData1.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#36A2EB', '#FF9F40'] // Blue, Orange - highly distinct
        }]
      };
    }

    // Update KG Activities chart 2 - Marked Activities
    if (this.kgActivitiesData2) {
      const data = [
        metrics.totalSlideKnowledgeGraphMarkedUnderstood || 0,
        metrics.totalSlideKnowledgeGraphMarkedNotUnderstood || 0,
        metrics.totalSlideKnowledgeGraphMarkedAsNew || 0
      ];
      this.kgActivitiesData2 = {
        ...this.kgActivitiesData2,
        datasets: [{
          ...this.kgActivitiesData2.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.kgActivitiesPieData2 = {
        labels: this.kgActivitiesData2.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#4BC0C0', '#FFCE56', '#FF6384'] // Teal, Yellow, Red - highly distinct
        }]
      };
    }

    // Update KG Activities chart 3 - Access by Location
    if (this.kgActivitiesData3) {
      const data = [
        metrics.courseKnowledgeGraphAccesses || 0,
        metrics.materialKnowledgeGraphAccesses || 0,
        metrics.slideKnowledgeGraphAccesses || 0
      ];
      this.kgActivitiesData3 = {
        ...this.kgActivitiesData3,
        datasets: [{
          ...this.kgActivitiesData3.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.kgActivitiesPieData3 = {
        labels: this.kgActivitiesData3.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#9966FF', '#FF9F40', '#36A2EB'] // Purple, Orange, Blue - highly distinct
        }]
      };
    }
  }

  private updateRecommendationCharts(metrics: any): void {
    // Update Recommendation Activities chart 2
    if (this.recommendationActivitiesData2) {
      const data = [
        metrics.totalRecommendedMaterialMarkedHelpful || 0,
        metrics.totalRecommendedMaterialMarkedNotHelpful || 0
      ];
      this.recommendationActivitiesData2 = {
        ...this.recommendationActivitiesData2,
        datasets: [{
          ...this.recommendationActivitiesData2.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.recommendationActivitiesPieData2 = {
        labels: this.recommendationActivitiesData2.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#4BC0C0', '#FF6384'] // Teal, Red - highly distinct
        }]
      };
    }

    // Update Recommendation Activities chart 3
    if (this.recommendationActivitiesData3) {
      const data = [
        metrics.recommendedConceptsMarkedUnderstood || 0,
        metrics.recommendedConceptsMarkedNotUnderstood || 0
      ];
      this.recommendationActivitiesData3 = {
        ...this.recommendationActivitiesData3,
        datasets: [{
          ...this.recommendationActivitiesData3.datasets[0],
          data: data
        }]
      };
      // Update pie chart data
      this.recommendationActivitiesPieData3 = {
        labels: this.recommendationActivitiesData3.labels,
        datasets: [{
          data: data,
          backgroundColor: ['#FFCE56', '#9966FF'] // Yellow, Purple - highly distinct
        }]
      };
    }
  }

  getEngagementColor(): string {
    const level = this.engagementLevel.toLowerCase();
    if (level === 'low') {
      return 'text-red-600';
    } else if (level === 'medium') {
      return 'text-yellow-600';
    } else if (level === 'high') {
      return 'text-green-600';
    }
    return 'text-gray-600';
  }

  getEngagementValue(): number {
    const level = this.engagementLevel.toLowerCase();
    if (level === 'low') {
      return 33;
    } else if (level === 'medium') {
      return 66;
    } else if (level === 'high') {
      return 100;
    }
    return 0;
  }

  getGaugeColor(): string {
    const level = this.engagementLevel.toLowerCase();
    if (level === 'low') {
      return '#ef4444'; // red
    } else if (level === 'medium') {
      return '#eab308'; // yellow
    } else if (level === 'high') {
      return '#22c55e'; // green
    }
    return '#6b7280'; // gray
  }

  private initializeGauge(): void {
    const value = this.getEngagementValue();
    const color = this.getGaugeColor();
    
    this.gaugeData = {
      labels: ['Engagement Level'],
      datasets: [
        {
          data: [value, 100 - value],
          backgroundColor: [color, '#e5e7eb'],
          borderWidth: 0
        }
      ]
    };

    this.gaugeOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '75%',
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false
        }
      },
      rotation: -90,
      circumference: 180
    };
  }

  private initializeCharts(): void {
    // Total number of likes/dislikes on annotations chart
    this.likesDislikesData = {
      labels: ['Question', 'Note', 'External Resource'],
      datasets: [
        {
          label: 'Likes',
          backgroundColor: '#3b82f6', // blue
          data: [0, 0, 0]
        },
        {
          label: 'Dislikes',
          backgroundColor: '#f97316', // orange
          data: [0, 0, 0]
        }
      ]
    };
    this.likesDislikesOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          position: 'top',
        },
        title: {
          display: true,
          text: 'Total number of likes/dislikes on annotations'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grace: '15%',
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };

    // Added annotations chart
    this.addedAnnotationsData = {
      labels: ['Question', 'Note', 'External Resource'],
      datasets: [
        {
          label: 'Added Annotations',
          backgroundColor: '#a855f7', // purple (distinct from indigo/pink)
          data: [0, 0, 0]
        }
      ]
    };
    this.addedAnnotationsOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Added annotations'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grace: '15%',
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };

    // Total annotation interactions chart
    this.annotationInteractionsData = {
      labels: ['Annotations followed', 'Annotations mentioned', 'Annotations replied'],
      datasets: [
        {
          label: 'Interactions',
          backgroundColor: '#22c55e', // green
          data: [0, 0, 0]
        }
      ]
    };
    this.annotationInteractionsOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Total annotation interactions'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grace: '15%',
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };

    // Total tags added/viewed chart
    this.tagsData = {
      labels: ['Tags added', 'Tags viewed'],
      datasets: [
        {
          label: 'Tag Activity',
          backgroundColor: '#0ea5e9', // sky blue
          data: [0, 0]
        }
      ]
    };
    this.tagsOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Total tags added/viewed'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grace: '15%',
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };

    // PDF related activities chart
    this.pdfActivitiesData = {
      labels: ['PDFs started', 'PDFs completed'],
      datasets: [
        {
          label: 'PDF Activities',
          backgroundColor: '#6b7280', // dark grey
          data: [0, 0]
        }
      ]
    };
    this.pdfActivitiesOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'PDF related activities'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grace: '15%',
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };

    // Video related activities chart
    this.videoActivitiesData = {
      labels: ['Videos played', 'Videos completed'],
      datasets: [
        {
          label: 'Video Activities',
          backgroundColor: '#f97316', // orange
          data: [0, 0]
        }
      ]
    };

    // Combined slides viewed and video time chart
    this.slidesAndVideoTimeData = {
      labels: ['Total slides viewed', 'Time spent on videos (min)'],
      datasets: [
        {
          label: 'Material Engagement',
          backgroundColor: '#6366f1', // indigo
          data: [0, 0]
        }
      ]
    };
    this.slidesAndVideoTimeOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Total slides viewed and time spent on videos (min)'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grace: '15%',
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };
    this.videoActivitiesOptions = {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: 'Video related activities'
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grace: '15%',
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };

    // Initialize Access Activities charts
    this.accessActivitiesData1 = {
      labels: ['Course', 'Topic', 'Channel', 'Material'],
      datasets: [{
        label: 'Access Activities',
        backgroundColor: '#059669', // emerald
        data: [0, 0, 0, 0]
      }]
    };
    this.accessActivitiesOptions1 = this.createDefaultChartOptions('Access Activities by Type');

    this.accessActivitiesData3 = {
      labels: ['Course', 'Topic', 'Channel', 'Material'],
      datasets: [{
        label: 'Dashboard Access',
        backgroundColor: '#a3e635', // lime (brighter)
        data: [0, 0, 0, 0]
      }]
    };
    this.accessActivitiesOptions3 = this.createDefaultChartOptions('Dashboard Access Activities');

    // Initialize KG Activities charts
    this.kgActivitiesData1 = {
      labels: ['Total KG Accesses', 'Concepts/Wiki Viewed'],
      datasets: [{
        label: 'KG Summary',
        backgroundColor: '#f59e0b', // amber
        data: [0, 0]
      }]
    };
    this.kgActivitiesOptions1 = this.createDefaultChartOptions('Knowledge Graph Summary');

    this.kgActivitiesData2 = {
      labels: ['Marked Understood', 'Marked Not Understood', 'Marked as New'],
      datasets: [{
        label: 'KG Marked Activities',
        backgroundColor: '#ec4899', // pink
        data: [0, 0, 0]
      }]
    };
    this.kgActivitiesOptions2 = this.createDefaultChartOptions('Knowledge Graph Marked Activities');

    this.kgActivitiesData3 = {
      labels: ['Course KG Access', 'Material KG Access', 'Slide KG Access'],
      datasets: [{
        label: 'KG Access by Location',
        backgroundColor: '#8b5cf6', // purple
        data: [0, 0, 0]
      }]
    };
    this.kgActivitiesOptions3 = this.createDefaultChartOptions('Knowledge Graph Access by Location');

    // Initialize Recommendation Activities charts
    this.recommendationActivitiesData2 = {
      labels: ['Marked Helpful', 'Marked Not Helpful'],
      datasets: [{
        label: 'Recommendation Materials',
        backgroundColor: '#14b8a6', // teal
        data: [0, 0]
      }]
    };
    this.recommendationActivitiesOptions2 = this.createDefaultChartOptions('Recommended Materials');

    this.recommendationActivitiesData3 = {
      labels: ['Marked Understood', 'Marked Not Understood'],
      datasets: [{
        label: 'Recommendation Marked',
        backgroundColor: '#ef4444', // red
        data: [0, 0]
      }]
    };
    this.recommendationActivitiesOptions3 = this.createDefaultChartOptions('Recommended Concepts Marked');
  }

  private createDefaultChartOptions(title: string): any {
    return {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: {
          left: 10,
          right: 10,
          top: 10,
          bottom: 30
        }
      },
      plugins: {
        legend: {
          display: false
        },
        title: {
          display: true,
          text: title
        }
      },
      scales: {
        x: {
          categoryPercentage: 0.6,
          barPercentage: 0.5,
          ticks: {
            autoSkip: false,
            maxRotation: 45,
            minRotation: 0,
            font: {
              size: 11
            }
          }
        },
        y: {
          beginAtZero: true,
          grace: '15%',
          title: {
            display: true,
            text: 'count'
          }
        }
      }
    };
  }

  private createPieChartOptions(title: string): any {
    return {
      responsive: true,
      maintainAspectRatio: true,
      aspectRatio: 2,
      layout: {
        padding: {
          top: 10,
          bottom: 10,
          left: 10,
          right: 10
        }
      },
      plugins: {
        legend: {
          position: 'right',
          labels: {
            padding: 12,
            usePointStyle: true,
            font: {
              size: 11
            },
            generateLabels: (chart: any) => {
              const data = chart.data;
              if (data.labels.length && data.datasets.length) {
                const dataset = data.datasets[0];
                const total = dataset.data.reduce((acc: number, val: number) => acc + val, 0);
                return data.labels.map((label: string, i: number) => {
                  const value = dataset.data[i];
                  const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                  return {
                    text: `${label}: ${percentage}%`,
                    fillStyle: Array.isArray(dataset.backgroundColor) ? dataset.backgroundColor[i] : dataset.backgroundColor,
                    strokeStyle: Array.isArray(dataset.borderColor) ? dataset.borderColor[i] : dataset.borderColor,
                    lineWidth: dataset.borderWidth,
                    hidden: false,
                    index: i
                  };
                });
              }
              return [];
            }
          }
        },
        title: {
          display: true,
          text: title,
          font: {
            size: 13
          }
        },
        tooltip: {
          callbacks: {
            label: (context: any) => {
              const dataset = context.dataset;
              const total = dataset.data.reduce((acc: number, val: number) => acc + val, 0);
              const value = context.parsed;
              const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
              return `${context.label}: ${value} (${percentage}%)`;
            }
          }
        }
      },
      scales: {
        x: {
          display: false
        },
        y: {
          display: false
        }
      }
    };
  }

  private initializePieCharts(): void {
    // Initialize pie charts for all bar charts
    // Added Annotations pie chart
    this.addedAnnotationsPieData = {
      labels: ['Question', 'Note', 'External Resource'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56'] // Red, Blue, Yellow - highly distinct
      }]
    };
    this.addedAnnotationsPieOptions = this.createPieChartOptions('Added annotations');

    // Annotation Interactions pie chart
    this.annotationInteractionsPieData = {
      labels: ['Annotations followed', 'Annotations mentioned', 'Annotations replied'],
      datasets: [{
        data: [0, 0, 0],
        backgroundColor: ['#9966FF', '#FF9F40', '#4BC0C0'] // Purple, Orange, Teal - highly distinct
      }]
    };
    this.annotationInteractionsPieOptions = this.createPieChartOptions('Total annotation interactions');

    // Likes/Dislikes pie chart
    this.likesDislikesPieData = {
      labels: [
        'Likes - Question', 'Likes - Note', 'Likes - External Resource',
        'Dislikes - Question', 'Dislikes - Note', 'Dislikes - External Resource'
      ],
      datasets: [{
        data: [0, 0, 0, 0, 0, 0],
        backgroundColor: [
          '#36A2EB', '#4BC0C0', '#9966FF', // Blue, Teal, Purple for likes
          '#FF6384', '#FF9F40', '#FFCE56'  // Red, Orange, Yellow for dislikes
        ]
      }]
    };
    this.likesDislikesPieOptions = this.createPieChartOptions('Total number of likes/dislikes on annotations');

    // Tags pie chart
    this.tagsPieData = {
      labels: ['Tags added', 'Tags viewed'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#FF6384', '#36A2EB'] // Red, Blue - highly distinct
      }]
    };
    this.tagsPieOptions = this.createPieChartOptions('Total tags added/viewed');

    // PDF Activities pie chart
    this.pdfActivitiesPieData = {
      labels: ['PDFs started', 'PDFs completed'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#36A2EB', '#FF6384'] // Blue, Red - highly distinct
      }]
    };
    this.pdfActivitiesPieOptions = this.createPieChartOptions('PDF related activities');

    // Video Activities pie chart
    this.videoActivitiesPieData = {
      labels: ['Videos played', 'Videos completed'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#FFCE56', '#9966FF'] // Yellow, Purple - highly distinct
      }]
    };
    this.videoActivitiesPieOptions = this.createPieChartOptions('Video related activities');

    // Slides and Video Time pie chart
    this.slidesAndVideoTimePieData = {
      labels: ['Total slides viewed', 'Time spent on videos (min)'],
      datasets: [{
        data: [0, 0],
        backgroundColor: ['#FF9F40', '#4BC0C0'] // Orange, Teal - highly distinct
      }]
    };
    this.slidesAndVideoTimePieOptions = this.createPieChartOptions('Total slides viewed and time spent on videos (min)');

    // Access Activities pie chart options
    this.accessActivitiesPieOptions1 = this.createPieChartOptions('Access Activities - Overview');
    this.accessActivitiesPieOptions3 = this.createPieChartOptions('Dashboard Accesses');

    // KG Activities pie chart options
    this.kgActivitiesPieOptions1 = this.createPieChartOptions('Knowledge Graph Activities');
    this.kgActivitiesPieOptions2 = this.createPieChartOptions('KG Marked Activities');
    this.kgActivitiesPieOptions3 = this.createPieChartOptions('KG Access by Location');

    // Recommendation Activities pie chart options
    this.recommendationActivitiesPieOptions2 = this.createPieChartOptions('Recommended Material Feedback');
    this.recommendationActivitiesPieOptions3 = this.createPieChartOptions('Recommended Concepts Feedback');
  }

  /**
   * Get top N peers for a specific metric
   * Filters out the current user and sorts by the metric value in descending order
   * @param metricKey - The metric key to sort peers by
   * @param n - Number of top peers to return
   * @param courseId - The course ID (used for logging, filtering already done by backend)
   * @returns Array of top N peers sorted by the metric value
   */
  private getTopPeersForMetric(metricKey: string, n: number, courseId: string): any[] {
    if (!this.peerActivitiesData || this.peerActivitiesData.length === 0) {
      console.warn('No peer activities data available');
      return [];
    }

    // Peers are already filtered by course from backend, just exclude current user
    const coursePeers = this.peerActivitiesData.filter((peer: any) => {
      return peer.stdUsername !== this.userId;
    });
    
    if (coursePeers.length === 0) {
      console.warn('No peers found (excluding current user)');
      return [];
    }

    // Sort by the metric value (descending) and take top N
    const sortedPeers = coursePeers
      .map((peer: any) => ({
        ...peer,
        value: peer[metricKey] || 0
      }))
      .sort((a: any, b: any) => b.value - a.value)
      .slice(0, n);

    return sortedPeers;
  }

  /**
   * Get the maximum number of peers available for comparison
   * @returns The count of available peers (excluding current user), max 5
   */
  getMaxAvailablePeers(): number {
    if (!this.peerActivitiesData || this.peerActivitiesData.length === 0) {
      return 0;
    }
    // Exclude current user from count
    const availablePeers = this.peerActivitiesData.filter((peer: any) => {
      return peer.stdUsername !== this.userId;
    }).length;
    // Cap at 5
    return Math.min(availablePeers, 5);
  }

  /**
   * Get available peer count options for the overlay panel
   * @returns Array of numbers [1, 2, ...n] where n is min(available peers, 5)
   */
  getAvailablePeerOptions(): number[] {
    const maxPeers = this.getMaxAvailablePeers();
    if (maxPeers === 0) return [1]; // Default to showing at least 1 option
    return Array.from({ length: maxPeers }, (_, i) => i + 1);
  }

  /**
   * Get chart data - returns appropriate data based on active tab
   * Uses caching to avoid repeated recalculation in template bindings
   */
  getChartDataForTab(chartName: string): any {
    // Check cache first - use currentTabValue in cache key
    const cacheKey = `${this.currentTabValue}_${chartName}`;
    if (this.chartDataCache[cacheKey]) {
      return this.chartDataCache[cacheKey];
    }
    
    let data: any;
    if (this.currentTabValue === 'top-peers') {
      data = this.getTopPeersChartData(chartName);
    } else if (this.currentTabValue === 'same-level') {
      data = this.getSameLevelChartData(chartName);
    } else if (this.currentTabValue === 'higher-level') {
      data = this.getHigherLevelChartData(chartName);
    } else {
      data = this.getChartData(chartName);
    }
    
    // Ensure data is valid - fallback to basic chart data if invalid
    if (!data || !data.labels || !data.datasets) {
      data = this.getChartData(chartName);
    }
    
    // Store in cache
    this.chartDataCache[cacheKey] = data;
    return data;
  }

  /**
   * Get chart data for same engagement level tab
   * Supports multi-metric charts showing You/Average/Maximum for each sub-activity
   */
  getSameLevelChartData(chartName: string): any {
    console.log(`getSameLevelChartData: chartName=${chartName}, hasEngagementMetrics=${!!this.engagementMetrics}, hasSameLevelStats=${!!this.sameLevelStats}`);
    
    if (!this.engagementMetrics || !this.sameLevelStats) {
      console.log('getSameLevelChartData: Missing data, falling back to getChartData');
      return this.getChartData(chartName);
    }

    // Check if this chart has multiple metrics for grouped bar chart
    const multiMetricMapping = this.getMultiMetricMappingForChart(chartName);
    
    if (multiMetricMapping) {
      return this.getGroupedSameLevelChartData(chartName, multiMetricMapping);
    }

    // Fall back to single metric for charts without multi-metric mapping
    const metricMapping = this.getMetricMappingForChart(chartName);
    console.log(`getSameLevelChartData: metricMapping=`, metricMapping);
    
    if (!metricMapping) {
      console.log('getSameLevelChartData: No metric mapping, falling back to getChartData');
      return this.getChartData(chartName);
    }

    // Get current user's data
    const userMetrics = this.engagementMetrics.metrics;
    let userValue = this.getMetricValue(userMetrics, metricMapping.metricKey);
    
    // Special handling for time spent on videos - convert to minutes
    if (metricMapping.metricKey === 'timeSpentOnVideos') {
      userValue = Math.round(userValue / 60);
    }
    console.log(`getSameLevelChartData: userValue=${userValue} for ${metricMapping.metricKey}`);

    // Get statistics for this metric
    const stats = this.sameLevelStats.statistics[metricMapping.metricKey];
    console.log(`getSameLevelChartData: stats=`, stats);
    
    if (!stats) {
      console.log('getSameLevelChartData: No stats for this metric, falling back to getChartData');
      return this.getChartData(chartName);
    }

    let average = stats.average || 0;
    let maximum = stats.maximum || 0;
    
    // Special handling for time spent on videos - convert to minutes
    if (metricMapping.metricKey === 'timeSpentOnVideos') {
      average = Math.round(average / 60);
      maximum = Math.round(maximum / 60);
    }
    console.log(`getSameLevelChartData: avg=${average}, max=${maximum}`);

    // Create chart data with user value, average, and maximum
    return {
      labels: ['You', 'Average of all users', 'Maximum user activity'],
      datasets: [{
        label: metricMapping.label,
        backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'], // Blue for user, green for average, orange for maximum
        data: [userValue, average, maximum]
      }]
    };
  }

  /**
   * Get grouped bar chart data for same engagement level comparison
   * Creates datasets where each sub-activity is shown as a group with You/Average/Maximum bars
   * @param chartName - The name of the chart
   * @param multiMetricMapping - The multi-metric mapping for the chart
   * @returns Chart data object with grouped bar chart structure
   */
  private getGroupedSameLevelChartData(chartName: string, multiMetricMapping: { metrics: { key: string; userKey?: string; peerKey?: string; label: string }[]; chartLabel: string }): any {
    console.log(`getGroupedSameLevelChartData: chartName=${chartName}, metrics=`, multiMetricMapping.metrics);
    
    // X-axis labels are the sub-activities (e.g., "PDFs started", "PDFs completed")
    const labels = multiMetricMapping.metrics.map(metric => metric.label);
    
    // Calculate values for each dataset (You, Average, Maximum)
    const userValues: number[] = [];
    const averageValues: number[] = [];
    const maximumValues: number[] = [];
    
    multiMetricMapping.metrics.forEach(metric => {
      // Get user's value
      const userKey = metric.userKey || metric.key;
      let userValue = 0;
      if (this.engagementMetrics?.metrics) {
        userValue = this.getMetricValue(this.engagementMetrics.metrics, userKey);
      }
      
      // Get statistics for this metric
      const stats = this.sameLevelStats?.statistics?.[metric.key];
      let average = stats?.average || 0;
      let maximum = stats?.maximum || 0;
      
      // Special handling for time spent on videos - convert to minutes
      if (userKey === 'timeSpentOnVideos' || metric.key === 'timeSpentOnVideos') {
        userValue = Math.round(userValue / 60);
        average = Math.round(average / 60);
        maximum = Math.round(maximum / 60);
      }
      
      userValues.push(userValue);
      averageValues.push(average);
      maximumValues.push(maximum);
    });
    
    console.log(`getGroupedSameLevelChartData: userValues=`, userValues, `averageValues=`, averageValues, `maximumValues=`, maximumValues);
    
    // Create three datasets: You, Average, Maximum
    // Each dataset has values for all sub-activities
    const datasets = [
      {
        label: 'You',
        backgroundColor: '#3b82f6', // Blue for user
        data: userValues
      },
      {
        label: 'Average of all users',
        backgroundColor: '#10b981', // Green for average
        data: averageValues
      },
      {
        label: 'Maximum user activity',
        backgroundColor: '#f59e0b', // Orange for maximum
        data: maximumValues
      }
    ];
    
    return {
      labels: labels,
      datasets: datasets,
      isGroupedChart: true // Flag to indicate this is a grouped chart
    };
  }

  /**
   * Get chart data for higher engagement level tab
   * Compares user's current activity with the minimum boundary from the next higher engagement level
   * Supports multi-metric charts showing You/Higher Level Minimum for each sub-activity
   * @param chartName - The name of the chart
   * @returns Chart data object with user's value and the minimum boundary from higher level
   */
  getHigherLevelChartData(chartName: string): any {
    console.log(`getHigherLevelChartData: chartName=${chartName}, hasEngagementMetrics=${!!this.engagementMetrics}, hasHigherLevelBoundaries=${!!this.higherLevelBoundaries}`);
    
    if (!this.engagementMetrics || !this.higherLevelBoundaries || this.higherLevelBoundaries.isHighestLevel) {
      console.log('getHigherLevelChartData: Missing data or at highest level, falling back to getChartData');
      return this.getChartData(chartName);
    }

    // Check if this chart has multiple metrics for grouped bar chart
    const multiMetricMapping = this.getMultiMetricMappingForChart(chartName);
    
    if (multiMetricMapping) {
      return this.getGroupedHigherLevelChartData(chartName, multiMetricMapping);
    }

    // Fall back to single metric for charts without multi-metric mapping
    const metricMapping = this.getMetricMappingForChart(chartName);
    console.log(`getHigherLevelChartData: metricMapping=`, metricMapping);
    
    if (!metricMapping) {
      console.log('getHigherLevelChartData: No metric mapping, falling back to getChartData');
      return this.getChartData(chartName);
    }

    // Get current user's data
    const userMetrics = this.engagementMetrics.metrics;
    let userValue = this.getMetricValue(userMetrics, metricMapping.metricKey);
    
    // Special handling for time spent on videos - convert to minutes
    if (metricMapping.metricKey === 'timeSpentOnVideos') {
      userValue = Math.round(userValue / 60);
    }
    console.log(`getHigherLevelChartData: userValue=${userValue} for ${metricMapping.metricKey}`);

    // Get boundary for this metric (minimum value from higher level)
    const boundaries = this.higherLevelBoundaries.boundaries;
    const boundary = boundaries?.[metricMapping.metricKey];
    console.log(`getHigherLevelChartData: boundary=`, boundary);
    
    if (!boundary) {
      console.log('getHigherLevelChartData: No boundary for this metric, falling back to getChartData');
      return this.getChartData(chartName);
    }

    // Note: Centroid values are stored in minutes, no conversion needed
    let minimumBoundary = boundary.minimum || 0;
    
    const higherLevel = this.higherLevelBoundaries.higherLevel || 'Higher';
    const higherLevelCapitalized = higherLevel.charAt(0).toUpperCase() + higherLevel.slice(1);
    console.log(`getHigherLevelChartData: minimum=${minimumBoundary}, higherLevel=${higherLevel}`);

    // Create chart data with user value and centroid threshold from higher level
    // Using grouped bar to show comparison
    return {
      labels: ['You', `${higherLevelCapitalized} Level Threshold`],
      datasets: [{
        label: metricMapping.label,
        backgroundColor: ['#3b82f6', '#8b5cf6'], // Blue for user, purple for higher level boundary
        data: [userValue, minimumBoundary]
      }]
    };
  }

  /**
   * Get grouped bar chart data for higher engagement level comparison
   * Creates datasets where each sub-activity is shown as a group with You/Higher Level Minimum bars
   * @param chartName - The name of the chart
   * @param multiMetricMapping - The multi-metric mapping for the chart
   * @returns Chart data object with grouped bar chart structure
   */
  private getGroupedHigherLevelChartData(chartName: string, multiMetricMapping: { metrics: { key: string; userKey?: string; peerKey?: string; label: string }[]; chartLabel: string }): any {
    console.log(`getGroupedHigherLevelChartData: chartName=${chartName}, metrics=`, multiMetricMapping.metrics);
    
    const higherLevel = this.higherLevelBoundaries?.higherLevel || 'Higher';
    const higherLevelCapitalized = higherLevel.charAt(0).toUpperCase() + higherLevel.slice(1);
    
    // X-axis labels are the sub-activities (e.g., "PDFs started", "PDFs completed")
    const labels = multiMetricMapping.metrics.map(metric => metric.label);
    
    // Calculate values for each dataset (You, Higher Level Minimum)
    const userValues: number[] = [];
    const minimumValues: number[] = [];
    
    multiMetricMapping.metrics.forEach(metric => {
      // Get user's value
      const userKey = metric.userKey || metric.key;
      let userValue = 0;
      if (this.engagementMetrics?.metrics) {
        userValue = this.getMetricValue(this.engagementMetrics.metrics, userKey);
      }
      
      // Get boundary for this metric (centroid values are stored in minutes)
      const boundary = this.higherLevelBoundaries?.boundaries?.[metric.key];
      let minimum = boundary?.minimum || 0;
      
      // Special handling for time spent on videos - convert user value to minutes (user data is in seconds)
      if (userKey === 'timeSpentOnVideos' || metric.key === 'timeSpentOnVideos') {
        userValue = Math.round(userValue / 60);
      }
      
      userValues.push(userValue);
      minimumValues.push(minimum);
    });
    
    console.log(`getGroupedHigherLevelChartData: userValues=`, userValues, `minimumValues=`, minimumValues);
    
    // Create two datasets: You, Higher Level Threshold
    const datasets = [
      {
        label: 'You',
        backgroundColor: '#3b82f6', // Blue for user
        data: userValues
      },
      {
        label: `${higherLevelCapitalized} Level Threshold`,
        backgroundColor: '#8b5cf6', // Purple for higher level boundary
        data: minimumValues
      }
    ];
    
    return {
      labels: labels,
      datasets: datasets,
      isGroupedChart: true // Flag to indicate this is a grouped chart
    };
  }

  /**
   * Check if current tab is higher level boundaries tab
   */
  isHigherLevelTab(): boolean {
    return this.currentTabValue === 'higher-level';
  }

  /**
   * Category definitions for the higher level summary progress chart
   * Maps category names to their respective chart names and colors
   */
  private readonly higherLevelCategoryDefinitions: { 
    name: string; 
    charts: string[]; 
    color: string; 
    bgColor: string;
    icon: string;
  }[] = [
    { 
      name: 'Material Activities', 
      charts: ['pdfActivities', 'videoActivities', 'slidesAndVideoTime'], 
      color: '#3b82f6', 
      bgColor: 'bg-blue-500',
      icon: 'pi-file'
    },
    { 
      name: 'Annotation Activities', 
      charts: ['addedAnnotations', 'annotationInteractions', 'likesDislikes', 'tags'], 
      color: '#10b981', 
      bgColor: 'bg-emerald-500',
      icon: 'pi-pencil'
    },
    { 
      name: 'Access Activities', 
      charts: ['accessActivities1', 'accessActivities3'], 
      color: '#f59e0b', 
      bgColor: 'bg-amber-500',
      icon: 'pi-sign-in'
    },
    { 
      name: 'Knowledge Graph Activities', 
      charts: ['kgActivities1', 'kgActivities2', 'kgActivities3'], 
      color: '#8b5cf6', 
      bgColor: 'bg-purple-500',
      icon: 'pi-share-alt'
    },
    { 
      name: 'Recommendation Activities', 
      charts: ['recommendationActivities2', 'recommendationActivities3'], 
      color: '#ec4899', 
      bgColor: 'bg-pink-500',
      icon: 'pi-star'
    }
  ];

  /**
   * Get summary data for the higher level progress chart
   * Aggregates activity counts across all categories and calculates thresholds
   * @returns Object containing category data, totals, and threshold information
   */
  getHigherLevelSummaryData(): { 
    categories: { 
      name: string; 
      userTotal: number; 
      thresholdTotal: number;
      color: string;
      bgColor: string;
      icon: string;
      meetsThreshold: boolean;
      percentage: number;
    }[];
    overallUserTotal: number;
    overallThresholdTotal: number;
    overallPercentage: number;
    meetsOverallThreshold: boolean;
    higherLevel: string;
    currentLevel: string;
  } {
    const categories: { 
      name: string; 
      userTotal: number; 
      thresholdTotal: number;
      color: string;
      bgColor: string;
      icon: string;
      meetsThreshold: boolean;
      percentage: number;
    }[] = [];
    
    let overallUserTotal = 0;
    let overallThresholdTotal = 0;

    const higherLevel = this.higherLevelBoundaries?.higherLevel || 'Higher';
    const currentLevel = this.higherLevelBoundaries?.currentUserEngagementLevel || this.engagementLevel || 'Current';

    for (const categoryDef of this.higherLevelCategoryDefinitions) {
      let categoryUserTotal = 0;
      let categoryThresholdTotal = 0;

      for (const chartName of categoryDef.charts) {
        // Get multi-metric mapping for this chart to get all sub-activities
        const multiMetricMapping = this.getMultiMetricMappingForChart(chartName);
        
        if (multiMetricMapping) {
          for (const metric of multiMetricMapping.metrics) {
            // Get user's value
            let userValue = 0;
            if (this.engagementMetrics?.metrics) {
              userValue = this.getMetricValue(this.engagementMetrics.metrics, metric.userKey || metric.key);
              // Special handling for time spent on videos - convert to minutes
              if (metric.key === 'timeSpentOnVideos') {
                userValue = Math.round(userValue / 60);
              }
            }
            categoryUserTotal += userValue;

            // Get threshold value from higher level boundaries
            // Note: Centroid values are stored in minutes, no conversion needed
            const boundary = this.higherLevelBoundaries?.boundaries?.[metric.key];
            let thresholdValue = boundary?.minimum || 0;
            categoryThresholdTotal += thresholdValue;
          }
        } else {
          // Fall back to single metric
          const singleMetricMapping = this.getMetricMappingForChart(chartName);
          if (singleMetricMapping) {
            let userValue = 0;
            if (this.engagementMetrics?.metrics) {
              userValue = this.getMetricValue(this.engagementMetrics.metrics, singleMetricMapping.metricKey);
            }
            categoryUserTotal += userValue;

            const boundary = this.higherLevelBoundaries?.boundaries?.[singleMetricMapping.metricKey];
            categoryThresholdTotal += boundary?.minimum || 0;
          }
        }
      }

      // If categoryThresholdTotal is 0, try to use summary metrics from boundaries
      // This handles cases where clustering only provides summary metrics for a course
      if (categoryThresholdTotal === 0 && this.higherLevelBoundaries?.boundaries) {
        if (categoryDef.name === 'Access Activities') {
          const totalAccesses = this.higherLevelBoundaries.boundaries['totalAccesses']?.minimum || 0;
          const totalDashboardAccesses = this.higherLevelBoundaries.boundaries['totalDashboardAccesses']?.minimum || 0;
          categoryThresholdTotal = totalAccesses + totalDashboardAccesses;
        } else if (categoryDef.name === 'Annotation Activities') {
          categoryThresholdTotal = this.higherLevelBoundaries.boundaries['totalAddedAnnotations']?.minimum || 0;
        } else if (categoryDef.name === 'Knowledge Graph Activities') {
          categoryThresholdTotal = this.higherLevelBoundaries.boundaries['totalKnowledgeGraphAccesses']?.minimum || 0;
        } else if (categoryDef.name === 'Recommendation Activities') {
          categoryThresholdTotal = this.higherLevelBoundaries.boundaries['totalRecommendedMaterialViewed']?.minimum || 0;
        }
      }

      const meetsThreshold = categoryUserTotal >= categoryThresholdTotal;
      const percentage = categoryThresholdTotal > 0 
        ? Math.min(100, Math.round((categoryUserTotal / categoryThresholdTotal) * 100))
        : (categoryUserTotal > 0 ? 100 : 0);

      categories.push({
        name: categoryDef.name,
        userTotal: categoryUserTotal,
        thresholdTotal: categoryThresholdTotal,
        color: categoryDef.color,
        bgColor: categoryDef.bgColor,
        icon: categoryDef.icon,
        meetsThreshold,
        percentage
      });

      overallUserTotal += categoryUserTotal;
      overallThresholdTotal += categoryThresholdTotal;
    }

    // Use totalActivities for overall totals if available to ensure accuracy
    // especially when category-level thresholds are missing or incomplete
    const totalActivitiesBoundary = this.higherLevelBoundaries?.boundaries?.['totalActivities'];
    if (totalActivitiesBoundary && totalActivitiesBoundary.minimum > 0) {
      overallThresholdTotal = totalActivitiesBoundary.minimum;
    }

    if (this.engagementMetrics?.metrics?.totalActivities) {
      overallUserTotal = this.engagementMetrics.metrics.totalActivities;
    }

    const meetsOverallThreshold = overallUserTotal >= overallThresholdTotal;
    const overallPercentage = overallThresholdTotal > 0
      ? Math.min(100, Math.round((overallUserTotal / overallThresholdTotal) * 100))
      : (overallUserTotal > 0 ? 100 : 0);

    return {
      categories,
      overallUserTotal,
      overallThresholdTotal,
      overallPercentage,
      meetsOverallThreshold,
      higherLevel,
      currentLevel
    };
  }

  /**
   * Check if there are no users in the higher engagement level
   * @returns True if no users are at the higher engagement level
   */
  hasNoUsersAtHigherLevel(): boolean {
    return (this.higherLevelBoundaries?.higherLevelStats?.usersInHigherLevel || 0) === 0;
  }

  /**
   * Get chart data for top peers tab
   * Compares user's activity with top N peers in the course
   * Uses grouped bar charts where each group represents a metric and bars represent users
   * @param chartName - The name of the chart
   * @returns Chart data object with labels, datasets, and delta values
   */
  getTopPeersChartData(chartName: string): any {
    // Check if this chart has multiple metrics for grouped bar chart
    const multiMetricMapping = this.getMultiMetricMappingForChart(chartName);
    
    if (multiMetricMapping) {
      return this.getGroupedTopPeersChartData(chartName, multiMetricMapping);
    }
    
    // Fall back to single metric for charts without multi-metric mapping
    const metricMapping = this.getMetricMappingForChart(chartName);
    
    if (!metricMapping) {
      return this.getChartData(chartName);
    }

    // Get current user's data
    let userValue = 0;
    if (this.engagementMetrics?.metrics) {
      userValue = this.getMetricValue(this.engagementMetrics.metrics, metricMapping.metricKey);
    }

    // If no course ID or no peer data, show just the user
    if (!this.courseId || !this.peerActivitiesData || this.peerActivitiesData.length === 0) {
      return {
        labels: ['You'],
        datasets: [{
          label: metricMapping.label,
          backgroundColor: ['#3b82f6'],
          data: [userValue],
          deltaValues: [0]
        }]
      };
    }

    const peerCount = this.peerCounts[chartName] || 3;

    // Get top peers
    const topPeers = this.getTopPeersForMetric(metricMapping.metricKey, peerCount, this.courseId);

    // If no peers found, show just the user
    if (topPeers.length === 0) {
      return {
        labels: ['You'],
        datasets: [{
          label: metricMapping.label,
          backgroundColor: ['#3b82f6'],
          data: [userValue],
          deltaValues: [0]
        }]
      };
    }

    // Build labels in descending order: [You, 1st Top Peer, 2nd Top Peer, 3rd Top Peer]
    // This shows peers from highest rank to lowest (1st is best)
    const peerLabels = topPeers.map((peer: any, index: number) => {
      const ordinal = this.getOrdinalNumber(index + 1);
      return `${ordinal} Top Peer`;
    });
    
    const labels = ['You', ...peerLabels];

    // Build data matching the label order
    const peerData = topPeers.map((peer: any) => peer[metricMapping.metricKey] || 0);
    const data = [userValue, ...peerData];

    // Calculate delta values (difference between peer and user)
    const deltaValues = topPeers.map((peer: any) => {
      const peerValue = peer[metricMapping.metricKey] || 0;
      return peerValue - userValue;
    });

    // Generate distinct colors for user and each peer
    const colors = this.generatePeerComparisonColors(topPeers.length + 1, false);

    return {
      labels: labels,
      datasets: [{
        label: metricMapping.label,
        backgroundColor: colors,
        data: data,
        // Store delta values for use in chart options
        deltaValues: [0, ...deltaValues]
      }]
    };
  }

  /**
   * Get grouped bar chart data for top peers comparison
   * Creates datasets where each bar in a group represents an activity metric
   * and each group on the x-axis represents a participant (You, peers)
   * @param chartName - The name of the chart
   * @param multiMetricMapping - The multi-metric mapping for the chart
   * @returns Chart data object with grouped bar chart structure
   */
  private getGroupedTopPeersChartData(chartName: string, multiMetricMapping: { metrics: { key: string; userKey?: string; peerKey?: string; label: string }[]; chartLabel: string }): any {
    const peerCount = this.peerCounts[chartName] || 3;
    
    // Use the first metric's peer key to get top peers
    const primaryPeerKey = multiMetricMapping.metrics[0].peerKey || multiMetricMapping.metrics[0].key;
    const topPeers = this.getTopPeersForMetric(primaryPeerKey, peerCount, this.courseId);
    
    // Build participant labels for x-axis
    const peerLabels = topPeers.map((peer: any, index: number) => {
      const ordinal = this.getOrdinalNumber(index + 1);
      return `${ordinal} Top Peer`;
    });
    const participantLabels = ['You', ...peerLabels];
    
    // X-axis labels are the participants (You + peers)
    const labels = participantLabels;
    
    // Colors for each metric/activity (for legend)
    const metricColors = this.generateMetricColors(multiMetricMapping.metrics.length);
    
    // Pre-calculate user values for all metrics (needed for delta calculation)
    const userValues = multiMetricMapping.metrics.map(metric => {
      let value = 0;
      if (this.engagementMetrics?.metrics) {
        const userKey = metric.userKey || metric.key;
        value = this.getMetricValue(this.engagementMetrics.metrics, userKey);
        // Special handling for time spent on videos - convert to minutes
        if (userKey === 'timeSpentOnVideos' || metric.key === 'timeSpentOnVideos') {
          value = Math.round(value / 60);
        }
      }
      return value;
    });
    
    // Create a dataset for each metric/activity (legend items)
    const datasets = multiMetricMapping.metrics.map((metric, metricIndex) => {
      // Get data for each participant for this metric
      const data = participantLabels.map((participantLabel, participantIndex) => {
        if (participantIndex === 0) {
          // User's data
          return userValues[metricIndex];
        } else {
          // Peer's data
          const peerIndex = participantIndex - 1;
          const peer = topPeers[peerIndex];
          if (peer) {
            // Use peerKey for peer data
            const peerKey = metric.peerKey || metric.key;
            let value = peer[peerKey] || 0;
            // Special handling for time spent on videos - convert to minutes
            if (peerKey === 'timeSpentOnVideos' || metric.key === 'timeSpentOnVideos') {
              value = Math.round(value / 60);
            }
            return value;
          }
          return 0;
        }
      });
      
      // Calculate delta values for each participant (difference from user)
      const deltaValues = participantLabels.map((participantLabel, participantIndex) => {
        if (participantIndex === 0) {
          return 0; // User has no delta
        }
        return data[participantIndex] - userValues[metricIndex];
      });
      
      return {
        label: metric.label, // Legend shows the activity name
        backgroundColor: metricColors[metricIndex],
        data: data,
        deltaValues: deltaValues
      };
    });
    
    return {
      labels: labels,
      datasets: datasets,
      isGroupedChart: true // Flag to indicate this is a grouped chart
    };
  }

  /**
   * Generate colors for peer comparison chart
   * User gets blue, peers get progressively different shades
   * @param count - Number of bars (user + peers)
   * @param reverseOrder - Whether to reverse peer colors to match ascending order display
   * @returns Array of color strings
   */
  private generatePeerComparisonColors(count: number, reverseOrder: boolean = false): string[] {
    const userColor = '#3b82f6'; // Blue for user
    const peerColors = ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']; // Green, amber, red, purple, pink
    
    const colors = [userColor];
    const peerCount = count - 1;
    const peerColorsArray: string[] = [];
    
    for (let i = 0; i < peerCount; i++) {
      peerColorsArray.push(peerColors[i % peerColors.length]);
    }
    
    // Reverse peer colors if displaying in ascending order (3rd, 2nd, 1st)
    if (reverseOrder) {
      peerColorsArray.reverse();
    }
    
    return [...colors, ...peerColorsArray];
  }

  /**
   * Generate colors for metric/activity bars in grouped bar charts
   * Each metric gets a distinct color for the legend
   * @param count - Number of metrics/activities
   * @returns Array of color strings
   */
  private generateMetricColors(count: number): string[] {
    // Distinct colors for different metrics/activities
    const metricColors = [
      '#3b82f6', // Blue
      '#10b981', // Emerald
      '#f59e0b', // Amber
      '#ef4444', // Red
      '#8b5cf6', // Purple
      '#ec4899', // Pink
      '#06b6d4', // Cyan
      '#84cc16'  // Lime
    ];
    
    const colors: string[] = [];
    for (let i = 0; i < count; i++) {
      colors.push(metricColors[i % metricColors.length]);
    }
    
    return colors;
  }

  /**
   * Get ordinal number suffix (1st, 2nd, 3rd, etc.)
   */
  private getOrdinalNumber(n: number): string {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  }

  /**
   * Get metric mapping for a chart
   */
  private getMetricMappingForChart(chartName: string): { metricKey: string; label: string } | null {
    const mappings: { [key: string]: { metricKey: string; label: string } } = {
      'addedAnnotations': { metricKey: 'totalAddedAnnotations', label: 'Added Annotations' },
      'annotationInteractions': { metricKey: 'totalAnnotationsReplied', label: 'Annotation Interactions' },
      'likesDislikes': { metricKey: 'totalLikesOnAnnotations', label: 'Likes/Dislikes' },
      'tags': { metricKey: 'totalAddedTags', label: 'Tags' },
      'pdfActivities': { metricKey: 'pdfStarted', label: 'PDF Activities' },
      'videoActivities': { metricKey: 'videosStarted', label: 'Video Activities' },
      'slidesAndVideoTime': { metricKey: 'slidesViewed', label: 'Slides & Video Time' },
      'accessActivities1': { metricKey: 'courseAccesses', label: 'Access Activities' },
      'accessActivities3': { metricKey: 'dashboardCourseAccesses', label: 'Dashboard Access' },
      'kgActivities1': { metricKey: 'totalKnowledgeGraphAccesses', label: 'KG Summary' },
      'kgActivities2': { metricKey: 'totalSlideKnowledgeGraphMarkedUnderstood', label: 'KG Marked' },
      'kgActivities3': { metricKey: 'courseKnowledgeGraphAccesses', label: 'KG Access by Location' },
      'recommendationActivities2': { metricKey: 'totalRecommendedMaterialViewed', label: 'Recommended Materials' },
      'recommendationActivities3': { metricKey: 'recommendedConceptsMarkedUnderstood', label: 'Recommended Concepts' }
    };

    return mappings[chartName] || null;
  }

  /**
   * Get multi-metric mapping for charts with multiple x-axis labels
   * Returns all metrics and labels for grouped bar chart display in top peers tab
   */
  private getMultiMetricMappingForChart(chartName: string): { metrics: { key: string; userKey?: string; peerKey?: string; label: string }[]; chartLabel: string } | null {
    const mappings: { [key: string]: { metrics: { key: string; userKey?: string; peerKey?: string; label: string }[]; chartLabel: string } } = {
      'pdfActivities': {
        chartLabel: 'PDF Activities',
        metrics: [
          { key: 'pdfStarted', userKey: 'pdfStarted', peerKey: 'pdfStarted', label: 'PDFs started' },
          { key: 'pdfCompleted', userKey: 'pdfCompleted', peerKey: 'pdfCompleted', label: 'PDFs completed' }
        ]
      },
      'videoActivities': {
        chartLabel: 'Video Activities',
        metrics: [
          { key: 'videosStarted', userKey: 'videosStarted', peerKey: 'videosStarted', label: 'Videos played' },
          { key: 'videosCompleted', userKey: 'videosCompleted', peerKey: 'videosCompleted', label: 'Videos completed' }
        ]
      },
      'slidesAndVideoTime': {
        chartLabel: 'Material Engagement',
        metrics: [
          { key: 'slidesViewed', userKey: 'slidesViewed', peerKey: 'slidesViewed', label: 'Total slides viewed' },
          { key: 'timeSpentOnVideos', userKey: 'timeSpentOnVideos', peerKey: 'timeSpentOnVideos', label: 'Time spent on videos (min)' }
        ]
      },
      'tags': {
        chartLabel: 'Tags',
        metrics: [
          { key: 'totalAddedTags', userKey: 'totalAddedTags', peerKey: 'totalAddedTags', label: 'Tags added' },
          { key: 'totalTagViewed', userKey: 'totalTagViewed', peerKey: 'totalTagViewed', label: 'Tags viewed' }
        ]
      },
      'accessActivities1': {
        chartLabel: 'Access Activities',
        metrics: [
          { key: 'courseAccesses', userKey: 'courseAccesses', peerKey: 'courseAccesses', label: 'Course' },
          { key: 'topicAccesses', userKey: 'topicAccesses', peerKey: 'topicAccesses', label: 'Topic' },
          { key: 'channelAccesses', userKey: 'channelAccesses', peerKey: 'channelAccesses', label: 'Channel' },
          { key: 'materialAccesses', userKey: 'materialAccesses', peerKey: 'materialAccesses', label: 'Material' }
        ]
      },
      'accessActivities3': {
        chartLabel: 'Dashboard Access',
        metrics: [
          { key: 'dashboardCourseAccesses', userKey: 'dashboardCourseAccesses', peerKey: 'dashboardCourseAccesses', label: 'Course' },
          { key: 'dashboardTopicAccesses', userKey: 'dashboardTopicAccesses', peerKey: 'dashboardTopicAccesses', label: 'Topic' },
          { key: 'dashboardChannelAccesses', userKey: 'dashboardChannelAccesses', peerKey: 'dashboardChannelAccesses', label: 'Channel' },
          { key: 'dashboardMaterialAccesses', userKey: 'dashboardMaterialAccesses', peerKey: 'dashboardMaterialAccesses', label: 'Material' }
        ]
      },
      'kgActivities1': {
        chartLabel: 'KG Summary',
        metrics: [
          { key: 'totalKnowledgeGraphAccesses', userKey: 'totalKnowledgeGraphAccesses', peerKey: 'totalKnowledgeGraphAccesses', label: 'Total KG Accesses' },
          { key: 'totalKnowledgeGraphConceptViewed', userKey: 'totalKnowledgeGraphConceptViewed', peerKey: 'totalKnowledgeGraphConceptViewed', label: 'Concepts/Wiki Viewed' }
        ]
      },
      'kgActivities2': {
        chartLabel: 'KG Marked Activities',
        metrics: [
          { key: 'totalSlideKnowledgeGraphMarkedUnderstood', userKey: 'totalSlideKnowledgeGraphMarkedUnderstood', peerKey: 'totalSlideKnowledgeGraphMarkedUnderstood', label: 'Marked Understood' },
          { key: 'totalSlideKnowledgeGraphMarkedNotUnderstood', userKey: 'totalSlideKnowledgeGraphMarkedNotUnderstood', peerKey: 'totalSlideKnowledgeGraphMarkedNotUnderstood', label: 'Marked Not Understood' },
          { key: 'totalSlideKnowledgeGraphMarkedAsNew', userKey: 'totalSlideKnowledgeGraphMarkedAsNew', peerKey: 'totalSlideKnowledgeGraphMarkedAsNew', label: 'Marked as New' }
        ]
      },
      'kgActivities3': {
        chartLabel: 'KG Access by Location',
        metrics: [
          { key: 'courseKnowledgeGraphAccesses', userKey: 'courseKnowledgeGraphAccesses', peerKey: 'courseKnowledgeGraphAccesses', label: 'Course KG Access' },
          { key: 'materialKnowledgeGraphAccesses', userKey: 'materialKnowledgeGraphAccesses', peerKey: 'materialKnowledgeGraphAccesses', label: 'Material KG Access' },
          { key: 'slideKnowledgeGraphAccesses', userKey: 'slideKnowledgeGraphAccesses', peerKey: 'slideKnowledgeGraphAccesses', label: 'Slide KG Access' }
        ]
      },
      'recommendationActivities2': {
        chartLabel: 'Recommendation Materials',
        metrics: [
          { key: 'totalRecommendedMaterialMarkedHelpful', userKey: 'totalRecommendedMaterialMarkedHelpful', peerKey: 'totalRecommendedMaterialMarkedHelpful', label: 'Marked Helpful' },
          { key: 'totalRecommendedMaterialMarkedNotHelpful', userKey: 'totalRecommendedMaterialMarkedNotHelpful', peerKey: 'totalRecommendedMaterialMarkedNotHelpful', label: 'Marked Not Helpful' }
        ]
      },
      'recommendationActivities3': {
        chartLabel: 'Recommendation Marked',
        metrics: [
          { key: 'recommendedConceptsMarkedUnderstood', userKey: 'recommendedConceptsMarkedUnderstood', peerKey: 'recommendedConceptsMarkedUnderstood', label: 'Marked Understood' },
          { key: 'recommendedConceptsMarkedNotUnderstood', userKey: 'recommendedConceptsMarkedNotUnderstood', peerKey: 'recommendedConceptsMarkedNotUnderstood', label: 'Marked Not Understood' }
        ]
      },
      'annotationInteractions': {
        chartLabel: 'Annotation Interactions',
        metrics: [
          { key: 'totalAnnotationsFollowed', userKey: 'totalAnnotationsFollowed', peerKey: 'totalAnnotationsFollowed', label: 'Annotations followed' },
          { key: 'totalUserMentionedRepliedActivities', userKey: 'totalUserMentionedRepliedActivities', peerKey: 'totalUserMentionedRepliedActivities', label: 'Annotations mentioned' },
          { key: 'totalAnnotationsReplied', userKey: 'totalAnnotationsReplied', peerKey: 'totalAnnotationsReplied', label: 'Annotations replied' }
        ]
      },
      'addedAnnotations': {
        chartLabel: 'Added Annotations',
        metrics: [
          { key: 'annotations.question', userKey: 'annotations.question', peerKey: 'totalQuestionTypeAnnotations', label: 'Question' },
          { key: 'annotations.note', userKey: 'annotations.note', peerKey: 'totalNoteTypeAnnotations', label: 'Note' },
          { key: 'annotations.externalResource', userKey: 'annotations.externalResource', peerKey: 'totalExternalResourceTypeAnnotations', label: 'External Resource' }
        ]
      }
    };

    return mappings[chartName] || null;
  }

  /**
   * Get metric value from user metrics
   */
  private getMetricValue(metrics: any, metricKey: string): number {
    // Handle nested metrics
    if (metricKey.includes('.')) {
      const parts = metricKey.split('.');
      let value = metrics;
      for (const part of parts) {
        value = value?.[part];
      }
      return value || 0;
    }
    return metrics[metricKey] || 0;
  }

  /**
   * Update peer count for a chart
   * @param chartName - The name of the chart
   * @param event - The change event from the input field
   */
  updatePeerCount(chartName: string, event: Event): void {
    const target = event.target as HTMLInputElement;
    const count = parseInt(target.value, 10) || 3;
    // Limit to 1-5 peers for comparison
    this.peerCounts[chartName] = Math.max(1, Math.min(5, count));
    // Invalidate chart cache for this chart
    this.chartDataCache = {};
    // Trigger change detection to refresh charts
    this.cdr.detectChanges();
  }

  /**
   * Open the peer count selector overlay panel
   * @param chartName - The name of the chart to set peer count for
   * @param event - The click event
   */
  openPeerCountSelector(chartName: string, event: Event): void {
    this.currentPeerCountChart = chartName;
    this.peerCountPanel.toggle(event);
  }

  /**
   * Select a peer count from the overlay panel
   * @param count - The number of peers to compare (1-5)
   */
  selectPeerCount(count: number): void {
    if (this.currentPeerCountChart) {
      this.peerCounts[this.currentPeerCountChart] = count;
      this.peerCountPanel.hide();
      // Invalidate chart cache for this chart
      this.chartDataCache = {};
      // Trigger change detection to refresh charts
      this.cdr.detectChanges();
    }
  }

  /**
   * Handle tab change event to refresh charts when switching tabs
   * This ensures charts render correctly with the appropriate data for each tab
   * @param event - The tab change event from PrimeNG TabView
   */
  onTabChange(event: any): void {
    this.chartRefreshCounter++;
    // Use event.index if available, otherwise use activeTabIndex
    const newIndex = event?.index ?? this.activeTabIndex;
    // Update cached tab value
    this.currentTabValue = this.tabs[newIndex]?.value || 'my-activities';
    // Invalidate chart cache to force recalculation
    this.chartDataCache = {};
    
    // Use setTimeout to allow Angular to complete the tab switch before refreshing charts
    // This fixes the issue where charts don't render until browser zoom changes
    setTimeout(() => {
      this.cdr.detectChanges();
      this.refreshAllCharts();
    }, 50);
  }

  /**
   * Refresh all chart instances to fix rendering issues when charts become visible
   * This is necessary because Chart.js measures canvas size when created, but if
   * the canvas was hidden (e.g., in an inactive tab), it may have 0 dimensions.
   * Calling refresh/reinit forces the chart to recalculate its size.
   */
  private refreshAllCharts(): void {
    if (this.charts) {
      this.charts.forEach((chart: UIChart) => {
        if (chart && chart.chart) {
          // Force chart to recalculate size and redraw
          chart.chart.resize();
        }
      });
    }
    // Also dispatch a resize event as a fallback for any edge cases
    window.dispatchEvent(new Event('resize'));
  }

  /**
   * Check if current tab is top peers
   */
  isTopPeersTab(): boolean {
    return this.currentTabValue === 'top-peers';
  }

  /**
   * Check if current tab is same level
   */
  isSameLevelTab(): boolean {
    return this.currentTabValue === 'same-level';
  }

  /**
   * Check if current tab is my activities
   */
  isMyActivitiesTab(): boolean {
    return this.currentTabValue === 'my-activities';
  }

  /**
   * Check if there are no other peers at the same engagement level for the current course
   * Returns true when the user is the only one at their engagement level
   */
  hasNoPeersAtSameLevel(): boolean {
    const peerCount = this.sameLevelStats?.sameLevelStats?.peerCount ?? 0;
    return peerCount === 0;
  }

  /**
   * Get the count of peers at the same engagement level (excluding current user)
   */
  getSameLevelPeerCount(): number {
    return this.sameLevelStats?.sameLevelStats?.peerCount ?? 0;
  }

  /**
   * Get the data for a specific category from the response
   */
  private getAnnotationDataForCategory(category: string, activities: any): AnnotationActivityDetail[] {
    switch (category) {
      case 'added': return activities.addedAnnotations || [];
      case 'interactions': return activities.annotationInteractions || [];
      case 'likesdislikes': return activities.likesAndDislikes || [];
      case 'tags': return activities.tagActivities || [];
      default: return [];
    }
  }

  /**
   * Get label for the current annotation details category
   */
  getAnnotationDetailsCategoryLabel(): string {
    switch (this.annotationDetailsCategory) {
      case 'added': return 'Annotations Added (Notes, Questions, External Resources)';
      case 'interactions': return 'Annotation Interactions (Followed, Mentioned, Replied)';
      case 'likesdislikes': return 'Likes and Dislikes on Annotations';
      case 'tags': return 'Tags Added or Viewed';
      default: return 'Annotation Activities';
    }
  }

  /**
   * Filter annotation details based on search input
   */
  filterAnnotationDetails(event: any): void {
    const filterValue = event.target.value?.toLowerCase() || '';
    if (!filterValue) {
      this.annotationDetailsData = this.getAnnotationDataForCategory(this.annotationDetailsCategory, this.annotationDetailsAllData);
      return;
    }
    
    const allData = this.getAnnotationDataForCategory(this.annotationDetailsCategory, this.annotationDetailsAllData);
    this.annotationDetailsData = allData.filter((item: AnnotationActivityDetail) => {
      return (item.type?.toLowerCase().includes(filterValue)) ||
             (item.verb?.toLowerCase().includes(filterValue)) ||
             (item.materialName?.toLowerCase().includes(filterValue)) ||
             (item.content?.toLowerCase().includes(filterValue));
    });
  }

  /**
   * Get the number of columns for the annotation details table
   */
  getAnnotationDetailsColspan(): number {
    return this.annotationDetailsCategory === 'added' ? 4 : 5;
  }

  /**
   * Get badge class for verb display
   */
  getVerbBadgeClass(verb: string): string {
    const verbLower = verb?.toLowerCase() || '';
    if (verbLower.includes('added') || verbLower.includes('asked')) {
      return 'bg-purple-100 text-purple-800';
    } else if (verbLower.includes('liked')) {
      return 'bg-green-100 text-green-800';
    } else if (verbLower.includes('disliked')) {
      return 'bg-red-100 text-red-800';
    } else if (verbLower.includes('followed')) {
      return 'bg-blue-100 text-blue-800';
    } else if (verbLower.includes('replied')) {
      return 'bg-yellow-100 text-yellow-800';
    } else if (verbLower.includes('mentioned')) {
      return 'bg-indigo-100 text-indigo-800';
    } else if (verbLower.includes('viewed')) {
      return 'bg-gray-100 text-gray-800';
    }
    return 'bg-gray-100 text-gray-800';
  }

  /**
   * Get icon class for annotation type
   */
  getTypeIcon(type: string): string {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower === 'note') {
      return 'pi-file-edit text-purple-600';
    } else if (typeLower === 'question') {
      return 'pi-question-circle text-blue-600';
    } else if (typeLower === 'external-resource') {
      return 'pi-external-link text-green-600';
    } else if (typeLower === 'tag') {
      return 'pi-tag text-orange-600';
    } else if (typeLower === 'annotation') {
      return 'pi-comment text-indigo-600';
    }
    return 'pi-file text-gray-600';
  }

  /**
   * Get display label for annotation type
   */
  getTypeLabel(type: string): string {
    const typeLower = type?.toLowerCase() || '';
    if (typeLower === 'note') return 'Note';
    if (typeLower === 'question') return 'Question';
    if (typeLower === 'external-resource') return 'External Resource';
    if (typeLower === 'tag') return 'Tag';
    if (typeLower === 'annotation') return 'Annotation';
    return type || 'Unknown';
  }

  /**
   * Get badge class for interaction type
   */
  getInteractionBadgeClass(interactionType: string): string {
    const type = interactionType?.toLowerCase() || '';
    if (type === 'followed') return 'bg-blue-100 text-blue-800';
    if (type === 'mentioned') return 'bg-indigo-100 text-indigo-800';
    if (type === 'replied') return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  }

  /**
   * Get delta values for maximized chart in top peers tab
   * Returns an array of delta information for each peer comparison
   * @param chartName - The name of the chart
   * @returns Array of delta objects with peer name, values, and delta info
   */
  getDeltaValuesForChart(chartName: string): any[] {
    if (!this.isTopPeersTab() || !this.engagementMetrics || !this.courseId) {
      return [];
    }

    // Check if this chart has multiple metrics for grouped bar chart
    const multiMetricMapping = this.getMultiMetricMappingForChart(chartName);
    
    if (multiMetricMapping) {
      return this.getDeltaValuesForGroupedChart(chartName, multiMetricMapping);
    }

    // Get metric mapping for the chart
    const metricMapping = this.getMetricMappingForChart(chartName);
    if (!metricMapping) {
      return [];
    }

    const userMetrics = this.engagementMetrics.metrics;
    const userValue = this.getMetricValue(userMetrics, metricMapping.metricKey);
    const peerCount = this.peerCounts[chartName] || 3;
    const topPeers = this.getTopPeersForMetric(metricMapping.metricKey, peerCount, this.courseId);

    const deltas = topPeers.map((peer: any, index: number) => {
      const peerValue = peer[metricMapping.metricKey] || 0;
      const delta = peerValue - userValue;
      const ordinal = this.getOrdinalNumber(index + 1);
      return {
        peerName: `${ordinal} Top Peer`,
        peerValue: peerValue,
        userValue: userValue,
        delta: delta,
        deltaPercent: userValue > 0 ? ((delta / userValue) * 100).toFixed(1) : (delta > 0 ? '+∞' : (delta < 0 ? '-∞' : '0'))
      };
    });

    return deltas;
  }

  /**
   * Get delta values for grouped charts with multiple activities
   * Returns delta information organized by activity, with peer comparisons for each
   * @param chartName - The name of the chart
   * @param multiMetricMapping - The multi-metric mapping for the chart
   * @returns Array of delta objects organized by activity with peer comparisons
   */
  private getDeltaValuesForGroupedChart(chartName: string, multiMetricMapping: { metrics: { key: string; userKey?: string; peerKey?: string; label: string }[]; chartLabel: string }): any[] {
    const userMetrics = this.engagementMetrics.metrics;
    const peerCount = this.peerCounts[chartName] || 3;
    
    // Use the first metric's peer key to get top peers
    const primaryPeerKey = multiMetricMapping.metrics[0].peerKey || multiMetricMapping.metrics[0].key;
    const topPeers = this.getTopPeersForMetric(primaryPeerKey, peerCount, this.courseId);

    // Get colors for the activities (matching the chart legend)
    const metricColors = this.generateMetricColors(multiMetricMapping.metrics.length);

    // Organize by activity - each activity shows comparison with all peers
    const deltas = multiMetricMapping.metrics.map((metric, metricIndex) => {
      const userKey = metric.userKey || metric.key;
      const peerKey = metric.peerKey || metric.key;
      
      // Get user's value for this activity
      let userValue = this.getMetricValue(userMetrics, userKey);
      
      // Special handling for time spent on videos - convert to minutes
      if (userKey === 'timeSpentOnVideos' || metric.key === 'timeSpentOnVideos') {
        userValue = Math.round(userValue / 60);
      }
      
      // Get peer comparisons for this activity
      const peerComparisons = topPeers.map((peer: any, index: number) => {
        const ordinal = this.getOrdinalNumber(index + 1);
        
        let peerValue = peer[peerKey] || 0;
        
        // Special handling for time spent on videos - convert to minutes
        if (peerKey === 'timeSpentOnVideos' || metric.key === 'timeSpentOnVideos') {
          peerValue = Math.round(peerValue / 60);
        }
        
        const delta = peerValue - userValue;
        
        return {
          peerName: `${ordinal} Top Peer`,
          peerValue: peerValue,
          delta: delta,
          deltaPercent: userValue > 0 ? ((delta / userValue) * 100).toFixed(1) : (delta > 0 ? '+∞' : (delta < 0 ? '-∞' : '0'))
        };
      });
      
      return {
        activityName: metric.label,
        activityColor: metricColors[metricIndex], // Color matching the chart legend
        userValue: userValue,
        peerComparisons: peerComparisons,
        isGroupedByActivity: true // Flag to indicate this is organized by activity
      };
    });

    return deltas;
  }

  /**
   * Get delta values for maximized chart in same engagement level tab
   * Returns an array of delta information comparing user to average and maximum
   * @param chartName - The name of the chart
   * @returns Array of delta objects with comparison name, values, and delta info
   */
  getDeltaValuesForSameLevelChart(chartName: string): any[] {
    if (!this.isSameLevelTab() || !this.engagementMetrics || !this.sameLevelStats?.statistics) {
      return [];
    }

    const metricMapping = this.getMetricMappingForChart(chartName);
    if (!metricMapping) {
      return [];
    }

    const userMetrics = this.engagementMetrics.metrics;
    const userValue = this.getMetricValue(userMetrics, metricMapping.metricKey);
    
    // Get statistics for this metric
    const stats = this.sameLevelStats.statistics[metricMapping.metricKey];
    if (!stats) {
      return [];
    }

    const average = stats.average || 0;
    const maximum = stats.maximum || 0;
    const peerCount = stats.count || 0;

    const deltas = [];

    // Comparison with average
    const avgDelta = average - userValue;
    deltas.push({
      peerName: 'Same Level Average',
      peerValue: average,
      userValue: userValue,
      delta: Math.round(avgDelta * 100) / 100,
      deltaPercent: userValue > 0 ? ((avgDelta / userValue) * 100).toFixed(1) : (avgDelta > 0 ? '+∞' : (avgDelta < 0 ? '-∞' : '0')),
      description: `Average of ${peerCount} peer(s) with ${this.sameLevelStats.currentUserEngagementLevel} engagement`
    });

    // Comparison with maximum
    const maxDelta = maximum - userValue;
    deltas.push({
      peerName: 'Same Level Maximum',
      peerValue: maximum,
      userValue: userValue,
      delta: Math.round(maxDelta * 100) / 100,
      deltaPercent: userValue > 0 ? ((maxDelta / userValue) * 100).toFixed(1) : (maxDelta > 0 ? '+∞' : (maxDelta < 0 ? '-∞' : '0')),
      description: `Highest value among peers with ${this.sameLevelStats.currentUserEngagementLevel} engagement`
    });

    return deltas;
  }

  /**
   * Get delta values for maximized chart in higher engagement level boundaries tab
   * Returns an array of delta information comparing user to the minimum boundary from the next higher level
   * Supports both single-metric and multi-metric (grouped bar) charts
   * @param chartName - The name of the chart
   * @returns Array of delta objects with comparison info
   */
  getDeltaValuesForHigherLevelChart(chartName: string): any[] {
    if (!this.isHigherLevelTab() || !this.engagementMetrics || !this.higherLevelBoundaries?.boundaries) {
      return [];
    }

    const higherLevel = this.higherLevelBoundaries.higherLevel || 'higher';
    const higherLevelCapitalized = higherLevel.charAt(0).toUpperCase() + higherLevel.slice(1);
    const userMetrics = this.engagementMetrics.metrics;
    const deltas: any[] = [];

    // Check if this chart has multi-metric mapping (grouped bar chart)
    const multiMetricMapping = this.getMultiMetricMappingForChart(chartName);
    
    if (multiMetricMapping) {
      // Handle multi-metric charts (e.g., pdfActivities, videoActivities, etc.)
      for (const metric of multiMetricMapping.metrics) {
        let userValue = this.getMetricValue(userMetrics, metric.userKey || metric.key);
        
        // Special handling for time spent on videos - convert to minutes
        if (metric.key === 'timeSpentOnVideos') {
          userValue = Math.round(userValue / 60);
        }

        // Get boundary for this metric (centroid values are stored in minutes)
        const boundary = this.higherLevelBoundaries.boundaries[metric.key];
        if (!boundary) {
          continue;
        }

        // Note: Centroid values are stored in minutes, no conversion needed
        let minimumBoundary = boundary.minimum || 0;
        
        const usersCount = boundary.usersCount || 0;
        const boundaryDelta = minimumBoundary - userValue;
        const meetsThreshold = userValue >= minimumBoundary;

        deltas.push({
          metricLabel: metric.label,
          peerName: `${higherLevelCapitalized} Level Threshold`,
          peerValue: minimumBoundary,
          userValue: userValue,
          delta: Math.round(boundaryDelta * 100) / 100,
          deltaPercent: userValue > 0 ? ((boundaryDelta / userValue) * 100).toFixed(1) : (boundaryDelta > 0 ? '+∞' : (boundaryDelta < 0 ? '-∞' : '0')),
          description: `Target threshold for "${metric.label}" to reach ${higherLevel} level (based on cluster centroid)`,
          gapInfo: boundaryDelta > 0 
            ? `You need ${boundaryDelta} more to reach this threshold`
            : boundaryDelta < 0 
              ? `You are ${Math.abs(boundaryDelta)} above this threshold ✓`
              : 'You have reached this threshold ✓',
          meetsThreshold: meetsThreshold
        });
      }
    } else {
      // Fall back to single metric for charts without multi-metric mapping
      const metricMapping = this.getMetricMappingForChart(chartName);
      if (!metricMapping) {
        return [];
      }

      const userValue = this.getMetricValue(userMetrics, metricMapping.metricKey);
      
      // Get boundary for this metric
      const boundary = this.higherLevelBoundaries.boundaries[metricMapping.metricKey];
      if (!boundary) {
        return [];
      }

      const minimumBoundary = boundary.minimum || 0;
      const usersCount = boundary.usersCount || 0;
      const boundaryDelta = minimumBoundary - userValue;
      const meetsThreshold = userValue >= minimumBoundary;

      deltas.push({
        metricLabel: metricMapping.label,
        peerName: `${higherLevelCapitalized} Level Threshold`,
        peerValue: minimumBoundary,
        userValue: userValue,
        delta: Math.round(boundaryDelta * 100) / 100,
        deltaPercent: userValue > 0 ? ((boundaryDelta / userValue) * 100).toFixed(1) : (boundaryDelta > 0 ? '+∞' : (boundaryDelta < 0 ? '-∞' : '0')),
        description: `Target threshold for ${higherLevel} engagement level (based on cluster centroid).`,
        gapInfo: boundaryDelta > 0 
          ? `You need ${boundaryDelta} more to reach this threshold`
          : boundaryDelta < 0 
            ? `You are ${Math.abs(boundaryDelta)} above this threshold ✓`
            : 'You have reached this threshold ✓',
        meetsThreshold: meetsThreshold
      });
    }

    return deltas;
  }

  /**
   * Get description for a chart based on current tab context
   * @param chartName - The name of the chart
   * @returns Description string for the tooltip
   */
  getChartDescription(chartName: string): string {
    // Check if we're in the top peers tab
    if (this.isTopPeersTab()) {
      return this.getTopPeersChartDescription(chartName);
    }

    // Check if we're in the same level tab
    if (this.isSameLevelTab()) {
      return this.getSameLevelChartDescription(chartName);
    }

    // Check if we're in the higher level tab
    if (this.isHigherLevelTab()) {
      return this.getHigherLevelChartDescription(chartName);
    }

    const descriptions: { [key: string]: string } = {
      'pdfActivities': 'This chart shows your PDF-related activities including PDFs started and PDFs completed. More details can be found in the maximized view.',
      'videoActivities': 'This chart displays your video engagement including videos started and completed. More details can be found in the maximized view.',
      'slidesAndVideoTime': 'This chart tracks the total number of slides you have viewed and the cumulative time spent watching videos. More details can be found in the maximized view.',
      'addedAnnotations': 'This chart shows the total number of annotations you have added to course materials. More details can be found in the maximized view.',
      'annotationInteractions': 'This chart displays your interactions with annotations including replies, mentions, and followed annotations. More details can be found in the maximized view.',
      'likesDislikes': 'This chart shows the total number of likes and dislikes you have given to annotations. More details can be found in the maximized view.',
      'tags': 'This chart displays the number of tags you have added to materials and tags you have viewed. More details can be found in the maximized view.',
      'accessActivities1': 'This chart shows how often you access different areas of the course including course pages, topics, channels, and materials. More details can be found in the maximized view.',
      'accessActivities3': 'This chart shows your dashboard access activities including course dashboard visits. More details can be found in the maximized view.',
      'kgActivities1': 'This chart displays your total Knowledge Graph accesses and the number of concepts/wiki pages you have viewed. More details can be found in the maximized view.',
      'kgActivities2': 'This chart shows how many concepts you have marked as understood, not understood, or new within the Knowledge Graph. More details can be found in the maximized view.',
      'kgActivities3': 'This chart shows where you accessed the Knowledge Graph from: course level, material level, or slide level. More details can be found in the maximized view.',
      'recommendationActivities2': 'This chart shows how many recommended materials you have viewed. More details can be found in the maximized view.',
      'recommendationActivities3': 'This chart displays how many recommended concepts you have marked as understood. More details can be found in the maximized view.'
    };

    return descriptions[chartName] || 'This chart displays your activity metrics for this category.';
  }

  /**
   * Get description for a chart in the same engagement level tab
   * @param chartName - The name of the chart
   * @returns Description string for the tooltip
   */
  private getSameLevelChartDescription(chartName: string): string {
    const metricMapping = this.getMetricMappingForChart(chartName);
    const metricLabel = metricMapping?.label || 'activities';
    const engagementLevel = this.sameLevelStats?.currentUserEngagementLevel || 'your';
    const peerCount = this.sameLevelStats?.sameLevelStats?.peerCount || this.sameLevelStats?.sameLevelStats?.usersWithSameEngagementLevel || 0;
    
    return `<strong>Same Engagement Level Comparison</strong><br/><br/>` +
      `This chart compares your ${metricLabel.toLowerCase()} against peers classified at the same engagement level (${engagementLevel}).<br/><br/>` +
      `<strong>Bars:</strong><br/>` +
      `• <span style="color:#3b82f6">Blue</span> = Your value<br/>` +
      `• <span style="color:#10b981">Green</span> = Average of ${peerCount} peer(s) with ${engagementLevel} engagement<br/>` +
      `• <span style="color:#f59e0b">Orange</span> = Maximum value among same-level peers<br/><br/>` +
      `<strong>Tip:</strong> Click maximize to see detailed delta values showing the difference between your activity and the peer average/maximum.`;
  }

  /**
   * Get description for a chart in the higher engagement level boundaries tab
   * @param chartName - The name of the chart
   * @returns Description string for the tooltip
   */
  private getHigherLevelChartDescription(chartName: string): string {
    const metricMapping = this.getMetricMappingForChart(chartName);
    const metricLabel = metricMapping?.label || 'activities';
    const currentLevel = this.higherLevelBoundaries?.currentUserEngagementLevel || 'current';
    const higherLevel = this.higherLevelBoundaries?.higherLevel || 'higher';
    const higherLevelCapitalized = higherLevel.charAt(0).toUpperCase() + higherLevel.slice(1);
    
    return `<strong>Higher Engagement Level Threshold</strong><br/><br/>` +
      `This chart shows what you need to achieve to reach the next engagement level (${higherLevelCapitalized}).<br/><br/>` +
      `<strong>Bars:</strong><br/>` +
      `• <span style="color:#3b82f6">Blue</span> = Your current ${metricLabel.toLowerCase()}<br/>` +
      `• <span style="color:#8b5cf6">Purple</span> = Target threshold (average activity for ${higherLevel} level users)<br/><br/>` +
      `<strong>Understanding the threshold:</strong><br/>` +
      `The purple bar represents the target threshold for ${metricLabel.toLowerCase()} at the ${higherLevel} engagement level. ` +
      `This value is based on the cluster centroid (average activity) of users at that level. ` +
      `Reaching or exceeding this value is one step towards advancing your engagement level.<br/><br/>` +
      `<strong>Tip:</strong> Click maximize to see detailed information about the gap between your current activity and the next level threshold.`;
  }

  /**
   * Get description for a chart in the top peers comparison tab
   * @param chartName - The name of the chart
   * @returns Description string for the tooltip
   */
  private getTopPeersChartDescription(chartName: string): string {
    const peerCount = this.peerCounts[chartName] || 3;
    const metricMapping = this.getMetricMappingForChart(chartName);
    const metricLabel = metricMapping?.label || 'activities';
    
    return `<strong>Top Peers Comparison</strong><br/><br/>` +
      `This chart compares your ${metricLabel.toLowerCase()} against the top ${peerCount} performers in this course.<br/><br/>` +
      `<strong>X-axis:</strong> You (first bar) followed by top peers ranked by their activity count<br/>` +
      `<strong>Y-axis:</strong> Activity count<br/><br/>` +
      `<strong>Tip:</strong> Use the "Peers" selector to compare with up to 5 top performers. ` +
      `Click maximize to see detailed delta values showing the difference between your activity and each peer.`;
  }
}