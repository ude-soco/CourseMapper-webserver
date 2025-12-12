import { Component, OnInit } from '@angular/core';
import { StorageService } from 'src/app/services/storage.service';
import { Store } from '@ngrx/store';
import { State } from 'src/app/state/app.state';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { User } from 'src/app/models/User';
import { Course } from 'src/app/models/Course';
import { getCurrentCourse } from 'src/app/pages/courses/state/course.reducer';
import { Neo4jService } from 'src/app/services/neo4j.service';
import { EngagementService, EngagementMetrics } from 'src/app/services/engagement.service';

@Component({
  selector: 'app-engagement-dashboard',
  templateUrl: './engagement-dashboard.component.html',
  styleUrls: ['./engagement-dashboard.component.css']
})
export class EngagementDashboardComponent implements OnInit {
  loggedInUser: User;
  engagementLevel: string = 'Low';
  currentCourse: Course | null = null;
  engagementMetrics: EngagementMetrics | null = null;

  constructor(
    private storageService: StorageService,
    private store: Store<State>,
    private neo4jService: Neo4jService,
    private engagementService: EngagementService
  ) {
    this.loggedInUser = this.storageService.getUser();
    this.store
      .select(getLoggedInUser)
      .subscribe((user) => {
        if (user) {
          this.loggedInUser = user;
          if (this.currentCourse) {
            this.loadEngagementData();
          }
        }
      });
    
    this.store
      .select(getCurrentCourse)
      .subscribe((course) => {
        if (course) {
          this.currentCourse = course;
          if (this.loggedInUser) {
            this.loadEngagementData();
          }
        }
      });
  }

  ngOnInit(): void {
    this.loadEngagementData();
  }

  private async loadEngagementData(): Promise<void> {
    if (!this.loggedInUser || !this.currentCourse) {
      return;
    }

    try {
      // Fetch engagement level from Neo4j
      await this.calculateEngagementLevel();
      
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

  private async calculateEngagementLevel(): Promise<void> {
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

