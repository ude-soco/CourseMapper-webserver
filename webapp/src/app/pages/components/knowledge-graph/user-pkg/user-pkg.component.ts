import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

import * as UserPkgActions from './state/user-pkg.actions';
import * as UserPkgSelectors from './state/user-pkg.reducer';
import { 
  ConceptDetail, 
  ConceptRecord, 
  ConceptData, 
  CourseNodeData 
} from './types/user-pkg.types';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { User } from 'src/app/models/User';
import { UserConceptsService } from 'src/app/services/user-concepts.service';
import { CourseService } from 'src/app/services/course.service';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';

@Component({
  selector: 'app-user-pkg',
  templateUrl: './user-pkg.component.html',
  styleUrls: ['./user-pkg.component.css'],
  providers: [MessageService]
})
export class UserPkgComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private currentUserId: string | null = null;

  // Observables from Store
  loggedInUser$ = this.store.select(getLoggedInUser);
  rawConceptRecords$ = this.store.select(UserPkgSelectors.selectRawRecords);
  isLoading$ = this.store.select(UserPkgSelectors.selectIsLoading);
  error$ = this.store.select(UserPkgSelectors.selectError);
  viewMode$ = this.store.select(UserPkgSelectors.selectViewMode);
  
  // Concept details panel state
  selectedConcept: ConceptData | null = null;
  conceptDetails: ConceptDetail[] = [];
  showConceptDetails = false;
  
  // Course details panel state
  selectedCourseNode: CourseNodeData | null = null;
  showCourseDetails = false;
  
  // Dynamic legend state
  showUnderstoodLegend = false;
  showNotUnderstoodLegend = false;
  showUnknownLegend = false;
  showCourseLegend = false;
  showUserLegend = true; // User node is always present
  showMainConceptLegend = false;
  showRelatedConceptLegend = false;
  
  // Help dialog state
  showHelpDialog = false;

  constructor(
    private store: Store,
    private router: Router,
    private messageService: MessageService,
    private userConceptsService: UserConceptsService,
    private courseService: CourseService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.subscribeToErrors();
    this.subscribeToDynamicLegend();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    
    // Don't clear state if we're navigating to dashboards
    const currentUrl = this.router.url;
    const navigatingToDashboard = 
      currentUrl.includes('/user/interest-level') || 
      currentUrl.includes('/user/engagement');
    
    if (!navigatingToDashboard) {
      this.store.dispatch(UserPkgActions.clearUserPkg());
    }
  }

  private initializeComponent(): void {
    this.loggedInUser$
      .pipe(
        takeUntil(this.destroy$),
        filter((user): user is User => user !== null)
      )
      .subscribe((user) => {
        this.currentUserId = user.id;
        this.checkForReturnView();
        this.loadKnowledgeGraph();
      });
  }

  private checkForReturnView(): void {
    // Check sessionStorage for return view mode
    const returnView = sessionStorage.getItem('pkgReturnView');
    if (returnView && (returnView === 'interest' || returnView === 'engagement' || returnView === 'knowledge')) {
      this.store.dispatch(UserPkgActions.setViewMode({ viewMode: returnView as any }));
      // Clear the stored view
      sessionStorage.removeItem('pkgReturnView');
    }
  }

  private subscribeToErrors(): void {
    this.error$
      .pipe(
        takeUntil(this.destroy$),
        filter((error): error is string => error !== null)
      )
      .subscribe((error) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: error,
        });
      });
  }

  private subscribeToDynamicLegend(): void {
    // Initial legend setup based on view mode
    this.viewMode$
      .pipe(takeUntil(this.destroy$))
      .subscribe(viewMode => {
        // Reset legend when view mode changes
        // Actual visibility will be updated by onVisibleNodesChanged
        if (viewMode === 'engagement') {
          this.showUnderstoodLegend = false;
          this.showNotUnderstoodLegend = false;
          this.showUnknownLegend = false;
        }
        
        // Show Main Concept and Related Concept legend only in Interest Level view
        this.showMainConceptLegend = viewMode === 'interest';
        this.showRelatedConceptLegend = false; // Will be set by onVisibleNodesChanged when related concepts are shown
      });
  }

  onVisibleNodesChanged(visibleNodes: any[]): void {
    if (!visibleNodes || visibleNodes.length === 0) {
      this.showUnderstoodLegend = false;
      this.showNotUnderstoodLegend = false;
      this.showUnknownLegend = false;
      this.showCourseLegend = false;
      this.showRelatedConceptLegend = false;
      this.cdr.detectChanges();
      return;
    }

    // Track node types in visible nodes
    const nodeTypes = new Set<string>();
    const relationshipTypes = new Set<string>();

    visibleNodes.forEach((node: any) => {
      const type = node.type;
      nodeTypes.add(type);
      
      if (type === 'main_concept' || type === 'related_concept') {
        const relType = node.relationshipType || node.type;
        relationshipTypes.add(relType);
      }
    });

    // Update legend visibility based on visible nodes
    this.showCourseLegend = nodeTypes.has('course');
    this.showUnderstoodLegend = relationshipTypes.has('u');
    this.showNotUnderstoodLegend = relationshipTypes.has('dnu');
    this.showUnknownLegend = relationshipTypes.has('unknown') || relationshipTypes.has('main_concept');
    this.showRelatedConceptLegend = nodeTypes.has('related_concept');

    this.cdr.detectChanges();
  }

  private loadKnowledgeGraph(): void {
    if (!this.currentUserId) return;

    // Load course hierarchy for advanced filters (cached in store)
    this.store.dispatch(UserPkgActions.loadCourseHierarchy());

    // Load user's knowledge graph
    this.store.select(UserPkgSelectors.selectTopNConcepts).pipe(take(1)).subscribe(topN => {
      this.store.dispatch(UserPkgActions.loadUserPkg({ userId: this.currentUserId!, topNConcepts: topN }));
    });
  }

  // Concept selection
  onConceptSelected(conceptData: any): void {
    this.selectedConcept = conceptData;
    // Clear previous details first to prevent overlapping
    this.conceptDetails = [];
    this.showConceptDetails = true;
    
    // Check view mode to determine how to fetch concept details
    this.viewMode$
      .pipe(take(1))
      .subscribe((viewMode) => {
        if (viewMode === 'interest') {
          // For interest mode, fetch occurrence data on-demand
          // Interest PKG doesn't load rawConceptRecords initially, so we need to fetch it
          this.fetchConceptOccurrencesForInterest(conceptData);
        } else {
          // For knowledge/engagement modes, use existing rawConceptRecords
          this.rawConceptRecords$
            .pipe(take(1))
            .subscribe((records) => {
              this.conceptDetails = this.extractConceptDetails(conceptData.cid, records);
            });
        }
      });
  }
  
  closeConceptDetails(): void {
    this.showConceptDetails = false;
    this.selectedConcept = null;
    this.conceptDetails = [];
  }

  // Concept status change (from context menu)
  onConceptStatusChanged(event: {concept: any, status: 'u' | 'dnu' | 'new'}): void {
    if (!this.currentUserId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'User not logged in',
      });
      return;
    }

    const conceptId = event.concept.cid;
    const wikipediaUrl = event.concept.wikipedia;
    
    if (!conceptId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Concept ID not found',
      });
      return;
    }
    
    // Find all concept IDs with the same Wikipedia URL (merged concepts)
    this.rawConceptRecords$.pipe(take(1)).subscribe(records => {
      let conceptIdsToUpdate: string[] = [conceptId];
      
      if (wikipediaUrl) {
        // Find all concepts with the same Wikipedia URL
        const mergedConcepts = records.filter(r => 
          r.wikipedia && r.wikipedia.toLowerCase().trim() === wikipediaUrl.toLowerCase().trim()
        );
        
        if (mergedConcepts.length > 1) {
          conceptIdsToUpdate = mergedConcepts.map(c => c.cid);
          console.log(`[User PKG] Updating ${conceptIdsToUpdate.length} merged concepts for Wikipedia URL: ${wikipediaUrl}`);
        }
      }
      
      // Optimistic update in NgRx state with the calculated concept IDs
      this.store.dispatch(UserPkgActions.updateConceptStatus({ 
        conceptIds: conceptIdsToUpdate,
        status: event.status 
      }));
      
      // Update all merged concepts in the backend
      this.userConceptsService.updateConceptsStatus(
        this.currentUserId,
        conceptIdsToUpdate,
        event.status
      ).subscribe({
        next: () => {
          const statusMessage = event.status === 'u' ? 'understood' : 
                                event.status === 'dnu' ? 'not understood' : 'new';
          const conceptCount = conceptIdsToUpdate.length > 1 ? ` (${conceptIdsToUpdate.length} concepts)` : '';
          this.messageService.add({
            severity: 'success',
            summary: 'Success',
            detail: `Concept "${event.concept.name}" marked as ${statusMessage}${conceptCount}`,
          });
        },
        error: (error) => {
          console.error('[User PKG] Failed to update concept status:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to save status change',
          });
        }
      });
    });
  }

  onCourseNodeClicked(courseData: any): void {
    console.log('[User PKG] Course node clicked:', courseData);
  }

  onCourseViewRequested(courseData: any): void {
    console.log('[User PKG] View course requested:', courseData);
    const courseId = courseData.courseId || courseData.id?.replace('course-', '');
    
    if (!courseId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Course ID not found',
      });
      return;
    }

    // Set course ID in store and navigate to course welcome page
    this.store.dispatch(CourseActions.setCourseId({ courseId: courseId }));
    this.router.navigate(['course', courseId, 'welcome']);
    
    this.messageService.add({
      severity: 'info',
      summary: 'Navigating',
      detail: `Opening course: ${courseData.name || courseData.courseName}`,
    });
  }

  onCourseDetailsRequested(courseData: any): void {
    console.log('[User PKG] Course details requested:', courseData);
    // Close concept details panel if open
    this.showConceptDetails = false;
    this.selectedConcept = null;
    
    // Open course details panel
    this.selectedCourseNode = courseData;
    this.showCourseDetails = true;
    this.cdr.detectChanges();
  }

  closeCourseDetails(): void {
    this.showCourseDetails = false;
    this.selectedCourseNode = null;
  }

  onCourseDetailsViewCourse(courseDetails: any): void {
    // Close the panel
    this.closeCourseDetails();
    
    // Navigate to course welcome page
    if (courseDetails._id) {
      this.store.dispatch(CourseActions.setCourseId({ courseId: courseDetails._id }));
      this.router.navigate(['course', courseDetails._id, 'welcome']);
    }
  }

  onCourseDetailsEngagementDashboard(courseDetails: any): void {
    // Close the panel
    this.closeCourseDetails();
    
    // Navigate to engagement dashboard
    if (courseDetails._id) {
      this.courseService.GetCourseById(courseDetails._id).subscribe({
        next: (course) => {
          if (course) {
            // Store current view mode before navigating
            sessionStorage.setItem('pkgReturnView', 'engagement');
            
            this.store.dispatch(CourseActions.setCurrentCourse({ selcetedCourse: course }));
            this.store.dispatch(CourseActions.setCourseId({ courseId: course._id }));
            this.router.navigate(['user/engagement']);
          }
        },
        error: (error) => {
          console.error('[User PKG] Error loading course:', error);
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Failed to load course details',
          });
        }
      });
    }
  }

  onCourseEngagementDashboardRequested(courseData: any): void {
    console.log('[User PKG] Engagement dashboard requested for course:', courseData);
    const courseId = courseData.courseId || courseData.id?.replace('course-', '');
    
    if (!courseId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Course ID not found',
      });
      return;
    }

    // Fetch course details and set in store, then navigate
    this.courseService.GetCourseById(courseId).subscribe({
      next: (course) => {
        if (course) {
          // Store current view mode before navigating
          sessionStorage.setItem('pkgReturnView', 'engagement');
          
          // Set the course in the store
          this.store.dispatch(CourseActions.setCurrentCourse({ selcetedCourse: course }));
          this.store.dispatch(CourseActions.setCourseId({ courseId: course._id }));
          
          // Navigate to engagement dashboard
          this.router.navigate(['user/engagement']);
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Error',
            detail: 'Course not found',
          });
        }
      },
      error: (error) => {
        console.error('[User PKG] Error loading course:', error);
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: 'Failed to load course details',
        });
      }
    });
  }

  onEdgeClicked(edgeData: any): void {
    console.log('[User PKG] Edge clicked:', edgeData);
    // Edge clicks on interest level graph are now handled via context menu
    // No action needed here for interest edges
  }

  openHelpDialog(): void {
    this.showHelpDialog = true;
  }

  closeHelpDialog(): void {
    this.showHelpDialog = false;
  }

  // Extract concept details from raw records (inline helper)
  private extractConceptDetails(conceptId: string, rawConceptRecords: ConceptRecord[]): ConceptDetail[] {
    const details: ConceptDetail[] = [];
    
    // First, find the concept by ID to get its Wikipedia URL and name
    const conceptRecord = rawConceptRecords.find(r => r.cid === conceptId);
    
    if (!conceptRecord) {
      return details;
    }
    
    const wikipediaUrl = conceptRecord.wikipedia;
    const conceptName = conceptRecord.name;
    const conceptNameLower = conceptName.toLowerCase().trim();
    
    // Filter records: if Wikipedia URL exists, match by URL; otherwise, match by name
    const matchingRecords = rawConceptRecords.filter(record => {
      if (wikipediaUrl) {
        // Match by Wikipedia URL (case-insensitive)
        return record.wikipedia && 
               record.wikipedia.toLowerCase().trim() === wikipediaUrl.toLowerCase().trim();
      } else {
        // Fallback to name matching
        return record.name.toLowerCase().trim() === conceptNameLower;
      }
    });
    
    matchingRecords.forEach(record => {
      const slides = record.slides || [];
      const validSlides = slides.filter(s => s.sid && s.name);
      
      if (validSlides.length > 0) {
        validSlides.forEach(slide => {
          details.push({
            slideId: slide.sid || undefined,
            slideName: slide.name || 'Unknown Slide',
            materialId: record.materialId || record.mid || '',
            materialName: record.materialName || 'Unknown Material',
            materialType: record.materialType,
            courseId: record.courseId,
            courseName: record.courseName || 'Unknown Course',
            courseShortName: record.courseShortName,
            channelId: record.channelId,
            relationshipType: record.relationshipType === 'u' || record.relationshipType === 'dnu' 
              ? record.relationshipType : undefined,
          });
        });
      } else {
        details.push({
          slideName: 'Material Level',
          materialId: record.materialId || record.mid || '',
          materialName: record.materialName || 'Unknown Material',
          materialType: record.materialType,
          courseId: record.courseId,
          courseName: record.courseName || 'Unknown Course',
          courseShortName: record.courseShortName,
          channelId: record.channelId,
          relationshipType: record.relationshipType === 'u' || record.relationshipType === 'dnu' 
            ? record.relationshipType : undefined,
        });
      }
    });
    
    return details;
  }

  // Fetch concept occurrences specifically for interest level PKG
  // Interest PKG only loads InterestConcepts (without slide/material details)
  // So we need to fetch occurrence data on-demand from the backend
  private fetchConceptOccurrencesForInterest(conceptData: any): void {
    if (!this.currentUserId) {
      console.error('[Interest PKG] No user ID available');
      return;
    }

    console.log('[Interest PKG] Fetching occurrences for concept:', conceptData);

    // Check if rawConceptRecords already has data (might be loaded in knowledge mode first)
    this.rawConceptRecords$
      .pipe(take(1))
      .subscribe((existingRecords) => {
        if (existingRecords && existingRecords.length > 0) {
          // rawConceptRecords already loaded, extract details from existing data
          console.log('[Interest PKG] Using existing rawConceptRecords');
          this.conceptDetails = this.extractConceptDetailsForInterest(
            conceptData.cid,
            conceptData.name,
            existingRecords
          );
          
          // Enrich selectedConcept with course info if available
          const conceptRecord = existingRecords.find(r => 
            r.cid === conceptData.cid || 
            r.name.toLowerCase() === conceptData.name.toLowerCase()
          );
          if (conceptRecord && !this.selectedConcept?.['courseName']) {
            this.selectedConcept = {
              ...this.selectedConcept,
              courseName: conceptRecord.courseName,
              courseShortName: conceptRecord.courseShortName,
              courseId: conceptRecord.courseId
            };
          }
        } else {
          // No existing data, show message that occurrences are not available
          // In pure interest mode, rawConceptRecords is not loaded by default
          console.log('[Interest PKG] No rawConceptRecords available, showing course info only');
          this.conceptDetails = [];
          
          // Show informative message
          this.messageService.add({
            severity: 'info',
            summary: 'Occurrence Details',
            detail: 'Switch to Knowledge view to see detailed occurrence information',
          });
        }
      });
  }

  // Extract concept details specifically for interest level PKG
  // This handles the data structure returned from the interest-specific API
  private extractConceptDetailsForInterest(
    conceptId: string,
    conceptName: string,
    rawConceptRecords: ConceptRecord[]
  ): ConceptDetail[] {
    const details: ConceptDetail[] = [];
    const conceptNameLower = conceptName.toLowerCase().trim();

    console.log('[Interest PKG] Extracting details for:', conceptName, 'from', rawConceptRecords.length, 'records');

    // For interest PKG, we match by concept name (since the concept might appear in multiple courses)
    // We also check Wikipedia URL if available for more accurate matching
    const matchingRecords = rawConceptRecords.filter(record => {
      const nameMatch = record.name.toLowerCase().trim() === conceptNameLower;
      const wikipediaMatch = record.wikipedia && 
        rawConceptRecords[0]?.wikipedia && 
        record.wikipedia.toLowerCase().trim() === rawConceptRecords[0].wikipedia.toLowerCase().trim();
      return nameMatch || wikipediaMatch;
    });

    console.log('[Interest PKG] Found', matchingRecords.length, 'matching records');

    // Extract details from matching records
    matchingRecords.forEach(record => {
      const slides = record.slides || [];
      const validSlides = slides.filter(s => s.sid && s.name);

      if (validSlides.length > 0) {
        // Create detail entry for each slide
        validSlides.forEach(slide => {
          details.push({
            slideId: slide.sid || undefined,
            slideName: slide.name || 'Unknown Slide',
            materialId: record.materialId || record.mid || '',
            materialName: record.materialName || 'Unknown Material',
            materialType: record.materialType,
            courseId: record.courseId,
            courseName: record.courseName || 'Unknown Course',
            courseShortName: record.courseShortName,
            channelId: record.channelId,
            relationshipType: record.relationshipType === 'u' || record.relationshipType === 'dnu' 
              ? record.relationshipType : undefined,
          });
        });
      } else if (record.materialId) {
        // Material-level entry (no specific slides)
        details.push({
          slideName: 'Material Level',
          materialId: record.materialId || record.mid || '',
          materialName: record.materialName || 'Unknown Material',
          materialType: record.materialType,
          courseId: record.courseId,
          courseName: record.courseName || 'Unknown Course',
          courseShortName: record.courseShortName,
          channelId: record.channelId,
          relationshipType: record.relationshipType === 'u' || record.relationshipType === 'dnu' 
            ? record.relationshipType : undefined,
        });
      }
    });

    console.log('[Interest PKG] Extracted', details.length, 'occurrence details');

    return details;
  }
}
