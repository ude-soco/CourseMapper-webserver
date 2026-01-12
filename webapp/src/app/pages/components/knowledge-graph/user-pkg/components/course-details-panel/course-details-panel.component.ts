import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MessageService } from 'primeng/api';
import { CourseNodeData, CourseDetails } from '../../types/user-pkg.types';
import { CourseService } from 'src/app/services/course.service';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import { State } from 'src/app/state/app.state';

@Component({
  selector: 'app-pkg-course-details-panel',
  templateUrl: './course-details-panel.component.html',
  styleUrls: ['./course-details-panel.component.css']
})
export class PkgCourseDetailsPanelComponent implements OnChanges {
  @Input() visible = false;
  @Input() courseNode: CourseNodeData | null = null;
  
  @Output() close = new EventEmitter<void>();
  @Output() viewCourse = new EventEmitter<CourseDetails>();
  @Output() viewEngagementDashboard = new EventEmitter<CourseDetails>();

  courseDetails: CourseDetails | null = null;
  isLoading = false;
  error: string | null = null;

  constructor(
    private router: Router,
    private store: Store<State>,
    private courseService: CourseService,
    private messageService: MessageService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['courseNode'] && this.courseNode && this.visible) {
      this.loadCourseDetails();
    }
  }

  private loadCourseDetails(): void {
    if (!this.courseNode) return;
    
    const courseId = this.courseNode.courseId || this.courseNode.id?.replace('course-', '');
    
    if (!courseId) {
      this.error = 'Course ID not found';
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.courseService.GetCourseById(courseId).subscribe({
      next: (course) => {
        this.isLoading = false;
        if (course) {
          this.courseDetails = {
            _id: course._id,
            name: course.name,
            shortName: course.shortName,
            description: course.description,
            role: course.role,
            numberOfTopics: course.numberTopics || 0,
            numberOfChannels: course.numberChannels || 0,
            createdAt: course.createdAt,
            updatedAt: course.createdAt // Use createdAt as fallback since updatedAt doesn't exist
          };
        } else {
          this.error = 'Course not found';
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.error = 'Failed to load course details';
        console.error('[Course Details Panel] Error loading course:', err);
      }
    });
  }

  onClose(): void {
    this.close.emit();
    this.courseDetails = null;
    this.error = null;
  }

  onViewCourse(): void {
    if (!this.courseDetails) return;
    
    // Set the course in the store
    this.store.dispatch(CourseActions.setCourseId({ courseId: this.courseDetails._id }));
    
    // Navigate to the course welcome page
    this.router.navigate(['course', this.courseDetails._id, 'welcome']);
    
    this.messageService.add({
      severity: 'info',
      summary: 'Navigating',
      detail: `Opening ${this.courseDetails.name}`,
    });
  }

  onViewEngagementDashboard(): void {
    if (!this.courseDetails) return;
    
    this.viewEngagementDashboard.emit(this.courseDetails);
  }

  getEngagementBadgeClass(): string {
    const level = this.courseNode?.engagementLevel?.toLowerCase();
    switch (level) {
      case 'high':
        return 'bg-green-100 text-green-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'N/A';
    }
  }
}
