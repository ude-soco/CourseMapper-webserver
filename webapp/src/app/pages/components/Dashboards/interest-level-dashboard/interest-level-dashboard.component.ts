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
  private activityGroupMapping: { [key: string]: { name: string; groups: string[] } } = {
    'annotation': {
      name: 'Annotation Activities',
      groups: ['G6'] // Follow Annotation
    },
    'material': {
      name: 'Material Activities',
      groups: ['G1', 'G2', 'G4', 'G8'] // Recommended Material, Concepts & Article, Full Article, View Slides
    },
    'access': {
      name: 'Access activities',
      groups: ['G10'] // Course Access
    },
    'kg': {
      name: 'Knowledge graph activities',
      groups: ['G2', 'G3', 'G4'] // Concepts & Article, Mark U/DNU, Full Article
    },
    'recommendation': {
      name: 'Recommendation Activities',
      groups: ['G1', 'G5', 'G7', 'G9'] // Recommended Material, Explanation, Recommended Concepts, Mark Recommended DNU
    }
  };

  // For "Concepts with Highest Score" tab
  topConcepts: Array<{ name: string; score: number; course: string }> = [];

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
    }).filter(cat => cat.activities.length > 0); // Only show categories with activities
  }

  toggleCategory(category: ActivityCategoryGroup): void {
    category.expanded = !category.expanded;
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
}
