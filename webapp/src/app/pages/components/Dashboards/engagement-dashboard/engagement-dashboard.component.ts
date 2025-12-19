import { Component, OnInit, OnDestroy } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';
import { Store } from '@ngrx/store';
import { State } from 'src/app/state/app.state';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { User } from 'src/app/models/User';
import { Course } from 'src/app/models/Course';
import { getCurrentCourse, getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';
import { Neo4jService } from 'src/app/services/neo4j.service';
import { EngagementService, EngagementMetrics } from 'src/app/services/engagement.service';
import { CourseService } from 'src/app/services/course.service';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import { Subscription } from 'rxjs';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-engagement-dashboard',
  templateUrl: './engagement-dashboard.component.html',
  styleUrls: ['./engagement-dashboard.component.css']
})
export class EngagementDashboardComponent implements OnInit, OnDestroy {
  private readonly STORAGE_KEY = 'engagementDashboard_selectedCourseId';
  loggedInUser: User;
  engagementLevel: string = 'Low';
  currentCourse: Course | null = null;
  engagementMetrics: EngagementMetrics | null = null;
  private courseSubscription: Subscription | null = null;
  private userSubscription: Subscription | null = null;

  constructor(
    private storageService: StorageService,
    private store: Store<State>,
    private neo4jService: Neo4jService,
    private engagementService: EngagementService,
    private courseService: CourseService
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
          // Save courseId to localStorage whenever it changes
          this.saveCourseIdToStorage(course._id);
          if (this.loggedInUser) {
            this.loadEngagementData();
          }
        }
      });
  }

  ngOnInit(): void {
    // Try to restore course from localStorage if not already set
    this.restoreCourseFromStorage();
    this.loadEngagementData();
  }

  ngOnDestroy(): void {
    if (this.courseSubscription) {
      this.courseSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private saveCourseIdToStorage(courseId: string): void {
    if (courseId) {
      try {
        localStorage.setItem(this.STORAGE_KEY, courseId);
      } catch (error) {
        console.error('Error saving courseId to localStorage:', error);
      }
    }
  }

  private async restoreCourseFromStorage(): Promise<void> {
    // Only restore if there's no current course in the store
    if (!this.currentCourse) {
      try {
        // Check if there's already a courseId in the store
        const storeCourseId = await firstValueFrom(this.store.select(getCurrentCourseId));
        
        // If there's no courseId in store either, try to restore from localStorage
        if (!storeCourseId) {
          const savedCourseId = localStorage.getItem(this.STORAGE_KEY);
          if (savedCourseId && this.loggedInUser) {
            // Fetch the course from the API and set it in the store
            this.courseService.GetCourseById(savedCourseId).subscribe({
              next: (course) => {
                if (course) {
                  // Set the course in the store
                  this.store.dispatch(CourseActions.setCurrentCourse({ selcetedCourse: course }));
                  this.store.dispatch(CourseActions.setCourseId({ courseId: course._id }));
                }
              },
              error: (error) => {
                console.error('Error restoring course from storage:', error);
                // If course doesn't exist or user doesn't have access, clear the stored ID
                localStorage.removeItem(this.STORAGE_KEY);
              }
            });
          }
        }
      } catch (error) {
        console.error('Error reading courseId from localStorage:', error);
      }
    }
  }

  private async loadEngagementData(): Promise<void> {
    if (!this.loggedInUser || !this.currentCourse) {
      return;
    }

    try {
      // Fetch engagement level from Neo4j
      await this.viewEngagementLevel();
      
      // Fetch engagement metrics from MongoDB
      this.engagementService.getUserEngagementMetrics(
        this.loggedInUser.id,
        this.currentCourse._id
      ).subscribe({
        next: (metrics) => {
          this.engagementMetrics = metrics;
          // Update engagement level if it comes from metrics
          if (metrics.engagementLevel) {
            this.engagementLevel = this.capitalizeFirstLetter(metrics.engagementLevel);
          }
        },
        error: (error) => {
          console.error('Error loading engagement metrics:', error);
        }
      });
    } catch (error) {
      console.error('Error loading engagement data:', error);
    }
  }

  private async viewEngagementLevel(): Promise<void> {
    if (!this.loggedInUser || !this.currentCourse) {
      this.engagementLevel = 'Low';
      return;
    }

    try {
      const userId = this.loggedInUser.id;
      const courseId = this.currentCourse._id;
      
      const engagementData = await this.neo4jService.getLevelofEngagement(userId);
      
      if (engagementData?.records && engagementData.records.length > 0) {
        // Find the engagement level for the current course
        const courseEngagement = engagementData.records.find(
          (record: any) => record.target?.properties?.cid === String(courseId)
        );
        
        if (courseEngagement?.r?.properties?.level) {
          this.engagementLevel = this.capitalizeFirstLetter(
            courseEngagement.r.properties.level
          );
        } else {
          this.engagementLevel = 'Low';
        }
      } else {
        this.engagementLevel = 'Low';
      }
    } catch (error) {
      console.error('Error fetching engagement level from Neo4j:', error);
      this.engagementLevel = 'Low';
    }
  }

  private capitalizeFirstLetter(str: string): string {
    if (!str) return 'Low';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  getEngagementLevel(): string {
    return this.engagementLevel;
  }

  getCourseName(): string {
    return this.currentCourse?.name || 'Course Engagement';
  }

  getEngagementMetrics(): EngagementMetrics | null {
    return this.engagementMetrics;
  }
}

