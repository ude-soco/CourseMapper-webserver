import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { StorageService } from 'src/app/services/storage.service';
import { Store } from '@ngrx/store';
import { State } from 'src/app/state/app.state';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { User } from 'src/app/models/User';
import { Course } from 'src/app/models/Course';
import { getCurrentCourse } from 'src/app/pages/courses/state/course.reducer';
import { EngagementService } from 'src/app/services/engagement.service';
import { CourseService } from 'src/app/services/course.service';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import * as EngagementActions from './state/engagement.actions';
import * as EngagementSelectors from './state/engagement.selectors';
import { EngagementMetrics } from './state/engagement.models';
import { Subscription } from 'rxjs';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'app-engagement-dashboard',
  templateUrl: './engagement-dashboard.component.html',
  styleUrls: ['./engagement-dashboard.component.css']
})
export class EngagementDashboardComponent implements OnInit, OnDestroy {
  loggedInUser: User;
  engagementLevel: string = 'Low';
  currentCourse: Course | null = null;
  engagementMetrics: EngagementMetrics | null = null;
  private courseSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;
  private metricsSubscription: Subscription | null = null;
  private levelSubscription: Subscription | null = null;

  constructor(
    private storageService: StorageService,
    private store: Store<State>,
    private engagementService: EngagementService,
    private courseService: CourseService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.loggedInUser = this.storageService.getUser();
    
    this.userSubscription = this.store
      .select(getLoggedInUser)
      .subscribe((user) => {
        if (user) {
          this.loggedInUser = user;
          if (this.currentCourse) {
            this.loadEngagementData();
          }
        }
      });
    
    this.courseSubscription = this.store
      .select(getCurrentCourse)
      .subscribe((course) => {
        if (course) {
          this.currentCourse = course;
          // Save courseId to NgRx store
          this.store.dispatch(EngagementActions.setEngagementCourseId({ courseId: course._id }));
          
          // Update URL if courseId is not in route
          const currentCourseId = this.route.snapshot.paramMap.get('courseId');
          if (currentCourseId !== course._id) {
            this.router.navigate(['/user/engagement', course._id], { replaceUrl: true });
          }
          
          if (this.loggedInUser) {
            this.loadEngagementData();
          }
        }
      });

    // Subscribe to engagement level from store
    this.levelSubscription = this.store
      .select(EngagementSelectors.selectEngagementLevel)
      .subscribe((level) => {
        if (level) {
          this.engagementLevel = level;
        }
      });

    // Subscribe to engagement metrics from store
    this.metricsSubscription = this.store
      .select(EngagementSelectors.selectEngagementMetrics)
      .subscribe((metrics) => {
        if (metrics) {
          this.engagementMetrics = metrics;
        }
      });
  }

  ngOnInit(): void {
    // Check if courseId is in URL
    const courseIdFromRoute = this.route.snapshot.paramMap.get('courseId');
    
    if (courseIdFromRoute) {
      // Restore course from URL parameter
      this.restoreCourseFromUrl(courseIdFromRoute);
    } else {
      // Check if there's already a course in the store
      this.store.select(getCurrentCourse).pipe(
        take(1)
      ).subscribe(course => {
        if (course) {
          // Update URL with current course
          this.router.navigate(['/user/engagement', course._id], { replaceUrl: true });
        } else {
          // Load engagement data if user and course are available
          this.loadEngagementData();
        }
      });
    }
  }

  private restoreCourseFromUrl(courseId: string): void {
    if (!this.loggedInUser) {
      return;
    }

    // Fetch the course and set it in the store
    this.courseService.GetCourseById(courseId).subscribe({
      next: (course) => {
        if (course) {
          this.store.dispatch(CourseActions.setCurrentCourse({ selcetedCourse: course }));
          this.store.dispatch(CourseActions.setCourseId({ courseId: course._id }));
        }
      },
      error: (error) => {
        console.error('Error restoring course from URL:', error);
        // Navigate to engagement without courseId if course not found
        this.router.navigate(['/user/engagement'], { replaceUrl: true });
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
    if (this.metricsSubscription) {
      this.metricsSubscription.unsubscribe();
    }
    if (this.levelSubscription) {
      this.levelSubscription.unsubscribe();
    }
  }

  private async loadEngagementData(): Promise<void> {
    if (!this.loggedInUser || !this.currentCourse) {
      return;
    }

    try {
      // Dispatch action to load engagement metrics
      this.store.dispatch(EngagementActions.loadEngagementMetrics({
        userId: this.loggedInUser.id,
        courseId: this.currentCourse._id
      }));

      // Fetch engagement metrics from service
      this.engagementService.getUserEngagementMetrics(
        this.loggedInUser.id,
        this.currentCourse._id
      ).subscribe({
        next: (metrics) => {
          // Dispatch success action with metrics
          this.store.dispatch(EngagementActions.loadEngagementMetricsSuccess({ metrics }));
        },
        error: (error) => {
          console.error('Error loading engagement metrics:', error);
          this.store.dispatch(EngagementActions.loadEngagementMetricsFailure({ error }));
        }
      });
    } catch (error) {
      console.error('Error loading engagement data:', error);
      this.store.dispatch(EngagementActions.loadEngagementMetricsFailure({ error }));
    }
  }

  getEngagementLevel(): string {
    return this.engagementLevel;
  }

  getCourseName(): string {
    return this.currentCourse?.name;
  }

  getEngagementMetrics(): EngagementMetrics | null {
    return this.engagementMetrics;
  }
}

