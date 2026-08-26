import { Component, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MessageService } from 'primeng/api';
import { 
  ConceptDetail, 
  ConceptData, 
  SlideNode, 
  MaterialNode, 
  CourseNode 
} from '../../types/user-pkg.types';
import { CourseService } from 'src/app/services/course.service';
import * as NotificationActions from 'src/app/pages/components/notifications/state/notifications.actions';
import { State } from 'src/app/state/app.state';

@Component({
  selector: 'app-pkg-concept-details-panel',
  templateUrl: './concept-details-panel.component.html',
  styleUrls: ['./concept-details-panel.component.css']
})
export class PkgConceptDetailsPanelComponent implements OnChanges {
  @Input() visible = false;
  @Input() concept: ConceptData | null = null;
  @Input() details: ConceptDetail[] = [];
  
  @Output() close = new EventEmitter<void>();

  courseTree: CourseNode[] = [];

  constructor(
    private router: Router,
    private store: Store<State>,
    private courseService: CourseService,
    private messageService: MessageService
  ) {}

  ngOnChanges(): void {
    // Clear the tree first to prevent overlapping
    this.courseTree = [];
    
    if (this.details && this.details.length > 0) {
      this.buildCourseTree();
    }
  }

  private buildCourseTree(): void {
    // Clear any existing tree data
    this.courseTree = [];
    const courseMap = new Map<string, CourseNode>();

    this.details.forEach(detail => {
      const courseId = detail.courseId || 'unknown';
      const materialId = detail.materialId || 'unknown';

      // Get or create course node
      if (!courseMap.has(courseId)) {
        courseMap.set(courseId, {
          courseId: courseId,
          courseName: detail.courseName || 'Unknown Course',
          courseShortName: detail.courseShortName,
          materials: []
        });
      }

      const courseNode = courseMap.get(courseId)!;

      // Find or create material node within this course
      let materialNode = courseNode.materials.find(m => m.materialId === materialId);
      if (!materialNode) {
        materialNode = {
          materialId: materialId,
          materialName: detail.materialName || 'Unknown Material',
          materialType: detail.materialType,
          slides: []
        };
        courseNode.materials.push(materialNode);
      }

      // Add slide to material
      materialNode.slides.push({
        slideId: detail.slideId,
        slideName: detail.slideName || 'Unknown Slide',
        detail: detail
      });
    });

    this.courseTree = Array.from(courseMap.values());
  }

  onClose(): void {
    this.close.emit();
  }

  onSlideClick(event: Event, detail: ConceptDetail): void {
    event.stopPropagation();
    this.navigateToSlide(detail);
  }

  onMaterialClick(event: Event, detail: ConceptDetail): void {
    event.stopPropagation();
    this.navigateToMaterial(detail);
  }

  onCourseClick(event: Event, detail: ConceptDetail): void {
    event.stopPropagation();
    this.navigateToCourse(detail);
  }

  // Navigate to specific slide
  private navigateToSlide(detail: ConceptDetail): void {
    if (!detail.courseId || !detail.materialId || !detail.channelId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Navigation Error',
        detail: 'Missing course, channel, or material information',
      });
      return;
    }

    // Set navigating flag
    this.courseService.navigatingToMaterial = true;

    // Determine material type (default to 'pdf' if not specified)
    const materialType = detail.materialType || 'pdf';
    
    // Extract page number from slide name
    const pageNumber = this.extractPageNumber(detail.slideName);

    // Build navigation URL
    const targetURL = `/course/${detail.courseId}/channel/${detail.channelId}/material/(material:${detail.materialId}/${materialType})`;
    
    this.router.navigateByUrl(targetURL);
    
    // For PDF materials with slide information, navigate to specific page
    if (materialType === 'pdf' && detail.slideId && pageNumber) {
      // Create an Annotation-like object for navigation
      const navigationAnnotation: any = {
        _id: detail.slideId,
        materialId: detail.materialId,
        materialType: materialType,
        content: detail.slideName,
        channelId: detail.channelId,
        courseId: detail.courseId,
        location: {
          type: 'Current Slide',
          startPage: pageNumber,
          lastPage: pageNumber,
        },
        // Additional properties used by the navigation system
        annotationId: detail.slideId,
        startPage: pageNumber,
      };
      
      // Dispatch notification action to navigate to the specific slide
      this.store.dispatch(
        NotificationActions.setCurrentlySelectedFollowingAnnotation({
          followingAnnotation: navigationAnnotation,
        })
      );
    }

    this.messageService.add({
      severity: 'info',
      summary: 'Navigating to Slide',
      detail: `Opening ${detail.slideName}${pageNumber ? ` (Page ${pageNumber})` : ''}`,
    });
  }

  // Navigate to material (without specific slide)
  private navigateToMaterial(detail: ConceptDetail): void {
    if (!detail.courseId || !detail.materialId || !detail.channelId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Navigation Error',
        detail: 'Missing course, channel, or material information',
      });
      return;
    }

    // Clear any previous slide navigation state by dispatching null
    this.store.dispatch(
      NotificationActions.setCurrentlySelectedFollowingAnnotation({
        followingAnnotation: null,
      })
    );

    // Set navigating flag
    this.courseService.navigatingToMaterial = true;

    // Determine material type (default to 'pdf' if not specified)
    const materialType = detail.materialType || 'pdf';

    // Navigate to material (first page/beginning)
    const targetURL = `/course/${detail.courseId}/channel/${detail.channelId}/material/(material:${detail.materialId}/${materialType})`;
    this.router.navigateByUrl(targetURL);

    this.messageService.add({
      severity: 'info',
      summary: 'Navigating to Material',
      detail: `Opening ${detail.materialName}`,
    });
  }

  // Navigate to course overview
  private navigateToCourse(detail: ConceptDetail): void {
    if (!detail.courseId) {
      this.messageService.add({
        severity: 'warn',
        summary: 'Navigation Error',
        detail: 'Missing course information',
      });
      return;
    }

    // Navigate to course overview page
    const targetURL = `/course/${detail.courseId}/welcome`;
    this.router.navigateByUrl(targetURL);

    this.messageService.add({
      severity: 'info',
      summary: 'Navigating to Course',
      detail: `Opening ${detail.courseName || detail.courseShortName}`,
    });
  }

  // Helper to extract page number from slide name if possible
  private extractPageNumber(slideName: string): number | undefined {
    // Try to extract number from slide name like "Slide 5" or "Page 5"
    const match = slideName.match(/\d+/);
    return match ? parseInt(match[0], 10) : undefined;
  }
}
