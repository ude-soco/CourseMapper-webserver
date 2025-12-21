import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { State } from 'src/app/state/app.state';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { User } from 'src/app/models/User';
import { Course } from 'src/app/models/Course';
import { getCurrentCourse } from 'src/app/pages/courses/state/course.reducer';
import { OverlayPanel } from 'primeng/overlaypanel';
import { InterestLevelService } from 'src/app/services/interest-level.service';
import { Subscription } from 'rxjs';

interface ActivityBreakdown {
  activity_id: string;
  activity_name: string;
  count: number;
  weight: number;
  contribution: number;
  group_id?: string;
  group_name?: string;
}

interface ConceptInterestData {
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

interface ActivityCategoryGroup {
  categoryName: string;
  categoryKey: string;
  activities: ActivityBreakdown[];
  totalCount: number;
  totalContribution: number;
  expanded: boolean;
  visible: boolean;
  showTextView?: boolean;
}

@Component({
  selector: 'app-interest-level-dashboard',
  templateUrl: './interest-level-dashboard.component.html',
  styleUrls: ['./interest-level-dashboard.component.css']
})
export class InterestLevelDashboardComponent implements OnInit, OnDestroy {
  conceptName: string = '';
  conceptId: string = '';
  interestScore: number = 0;
  conceptData: ConceptInterestData | null = null;
  
  loggedInUser: User | null = null;
  currentCourse: Course | null = null;
  
  private courseSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;
  private routeSubscription: Subscription | null = null;

  @ViewChild('activityFilterPanel') activityFilterPanel!: OverlayPanel;

  activeTabIndex: number = 0;
  tabs = [
    { label: 'My Activities', value: 'user-activities' },
    { label: 'Total Activities', value: 'all-activities' },
    { label: 'Concepts with Highest Score', value: 'highest-concepts' }
  ];

  // Activity categories with their mapping to activity groups
  activityCategories: ActivityCategoryGroup[] = [];

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

  // For "Concepts with Highest Score" tab
  topConcepts: Array<{ name: string; score: number; course: string }> = [];

  // Gauge chart for interest score visualization
  gaugeData: any;
  gaugeOptions: any;

  // Chart data for activity visualizations (using Chart.js format)
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

  // Total activities chart data
  totalActivitiesChartData: any;
  totalActivitiesChartOptions: any;

  // Top concepts chart data
  topConceptsChartData: any;
  topConceptsChartOptions: any;
  topConceptsLimit: number | 'All' = 5;

  // Top-N filter options (matching PKG filter controls)
  readonly topNOptions = [
    { label: '5', value: 5 },
    { label: '10', value: 10 },
    { label: '15', value: 15 },
    { label: '20', value: 20 },
    { label: '25', value: 25 },
    { label: '50', value: 50 }
  ];

  constructor(
    private route: ActivatedRoute,
    private store: Store<State>,
    private interestLevelService: InterestLevelService
  ) {
    this.userSubscription = this.store
      .select(getLoggedInUser)
      .subscribe((user) => {
        if (user) {
          this.loggedInUser = user;
          if (this.conceptName) {
            this.loadConceptData();
          }
        }
      });

    this.courseSubscription = this.store
      .select(getCurrentCourse)
      .subscribe((course) => {
        if (course) {
          this.currentCourse = course;
        }
      });
  }

  ngOnInit(): void {
    // Set sessionStorage so back button returns to interest view
    sessionStorage.setItem('pkgReturnView', 'interest');
    
    // Get concept name and ID from route query params
    this.routeSubscription = this.route.queryParams.subscribe(params => {
      this.conceptName = params['conceptName'] || '';
      this.conceptId = params['conceptId'] || '';
      
      if (this.conceptName && this.loggedInUser) {
        this.loadConceptData();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.courseSubscription) {
      this.courseSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
  }

  private loadConceptData(): void {
    if (!this.loggedInUser || !this.conceptName) return;

    this.interestLevelService.getUserConceptInterest(this.loggedInUser.id, this.conceptName).subscribe({
      next: (data) => {
        this.conceptData = data;
        this.interestScore = data.normalized_scores.min_max_interpolation;
        this.initializeActivityCategories();
        this.initializeGaugeChart();
        this.initializeCategoryCharts();
        this.initializeTotalActivitiesChart();
        this.loadTopConcepts();
      },
      error: (err) => {
        console.error('Error loading concept interest data:', err);
      }
    });
  }

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

      for (const [categoryKey, categoryInfo] of Object.entries(this.activityGroupMapping)) {
        if (categoryInfo.groups.includes(groupId)) {
          categories[categoryKey].push(activity);
        }
      }
    });

    // Build activity category groups
    this.activityCategories = Object.entries(this.activityGroupMapping).map(([key, info]) => {
      const activities = categories[key] || [];
      return {
        categoryName: info.name,
        categoryKey: key,
        activities: activities,
        totalCount: activities.reduce((sum, a) => sum + a.count, 0),
        totalContribution: activities.reduce((sum, a) => sum + a.contribution, 0),
        expanded: false,
        visible: true
      };
    })
    .filter(cat => cat.activities.length > 0) // Only show categories with activities
    .sort((a, b) => {
      // Sort by total weight from voting system (highest to lowest)
      const weightA = this.activityGroupMapping[a.categoryKey]?.totalWeight || 0;
      const weightB = this.activityGroupMapping[b.categoryKey]?.totalWeight || 0;
      return weightB - weightA;
    });
  }

  toggleCategory(category: ActivityCategoryGroup): void {
    category.expanded = !category.expanded;
  }

  toggleCategoryView(category: ActivityCategoryGroup): void {
    category.showTextView = !category.showTextView;
  }

  hasSingleActivity(category: ActivityCategoryGroup): boolean {
    return category.activities.length === 1;
  }

  openActivityFilter(event: Event): void {
    this.activityFilterPanel.toggle(event);
  }

  toggleCategoryVisibility(categoryKey: string): void {
    const category = this.activityCategories.find(c => c.categoryKey === categoryKey);
    if (category) {
      category.visible = !category.visible;
    }
  }

  getInterestScoreColor(): string {
    if (this.interestScore >= 0.7) return 'text-green-600';
    if (this.interestScore >= 0.4) return 'text-yellow-600';
    return 'text-red-600';
  }

  getInterestScoreLabel(): string {
    if (this.interestScore >= 0.7) return 'High Interest';
    if (this.interestScore >= 0.4) return 'Medium Interest';
    return 'Low Interest';
  }

  onTabChange(event: any): void {
    this.activeTabIndex = event.index;
  }

  getVisibleCategories(): ActivityCategoryGroup[] {
    return this.activityCategories.filter(c => c.visible);
  }

  // Format contribution as percentage of total raw score
  getContributionPercentage(contribution: number): string {
    if (!this.conceptData || this.conceptData.raw_score === 0) return '0%';
    return ((contribution / this.conceptData.raw_score) * 100).toFixed(1) + '%';
  }

  // Format category contribution as percentage of total raw score
  getCategoryContributionPercentage(totalContribution: number): string {
    if (!this.conceptData || this.conceptData.raw_score === 0) return '0%';
    return ((totalContribution / this.conceptData.raw_score) * 100).toFixed(1) + '%';
  }

  // Initialize gauge chart for interest score (matching engagement dashboard style)
  private initializeGaugeChart(): void {
    const score = this.interestScore;
    const remaining = 1 - score;

    this.gaugeData = {
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

    this.gaugeOptions = {
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
  }

  // Initialize Chart.js charts for each category
  private initializeCategoryCharts(): void {
    if (!this.conceptData) return;

    this.activityCategories.forEach(category => {
      this.initializeCategoryChart(category);
    });
  }

  // Initialize total activities chart (for "Total Activities" tab)
  private initializeTotalActivitiesChart(): void {
    if (!this.conceptData) return;

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

    this.totalActivitiesChartData = {
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

    this.totalActivitiesChartOptions = {
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
  }

  // Initialize chart for individual category using Chart.js format
  private initializeCategoryChart(category: ActivityCategoryGroup): void {
    const activities = category.activities.sort((a, b) => b.weight - a.weight);
    const labels = activities.map(a => a.activity_name);
    const counts = activities.map(a => a.count);
    const contributions = activities.map(a => a.contribution);

    // Bar chart data
    this.categoryChartData[category.categoryKey] = {
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
    this.categoryChartOptions[category.categoryKey] = {
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
  }

  // Load top concepts for the user
  private loadTopConcepts(): void {
    if (!this.loggedInUser) return;

    // Convert 'All' to a large number for the API call
    const limit = this.topConceptsLimit === 'All' ? 1000 : this.topConceptsLimit;

    this.interestLevelService.getTopConceptsByInterest(this.loggedInUser.id, limit).subscribe({
      next: (concepts) => {
        console.log(`Requested ${this.topConceptsLimit} concepts, received ${concepts.length} concepts`);
        this.topConcepts = concepts;
        this.initializeTopConceptsChart();
      },
      error: (err) => {
        console.error('Error loading top concepts:', err);
      }
    });
  }

  // Handle change in top concepts limit
  onTopConceptsLimitChange(newLimit: number | 'All'): void {
    this.topConceptsLimit = newLimit;
    this.loadTopConcepts();
  }

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

    this.topConceptsChartData = {
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

    this.topConceptsChartOptions = {
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
            maxRotation: 45,
            minRotation: 45
          }
        }
      },
      onResize: (chart: any) => {
        chart.canvas.parentNode.style.height = '800px';
      }
    };
  }
}
