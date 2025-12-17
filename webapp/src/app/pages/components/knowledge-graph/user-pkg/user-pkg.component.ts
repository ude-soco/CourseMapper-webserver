import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { takeUntil, filter, take } from 'rxjs/operators';
import { MessageService } from 'primeng/api';

import * as UserPkgActions from './state/user-pkg.actions';
import * as UserPkgSelectors from './state/user-pkg.reducer';
import { ConceptDetail, ConceptRecord } from './types/user-pkg.types';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { User } from 'src/app/models/User';
import { ConceptData } from './components/concept-details-panel/concept-details-panel.component';
import { UserConceptsService } from 'src/app/services/user-concepts.service';

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
  
  // Dynamic legend state
  showUnderstoodLegend = false;
  showNotUnderstoodLegend = false;
  showUnknownLegend = false;
  showCourseLegend = false;
  showUserLegend = true; // User node is always present
  
  // Help dialog state
  showHelpDialog = false;

  constructor(
    private store: Store,
    private messageService: MessageService,
    private userConceptsService: UserConceptsService,
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
    this.store.dispatch(UserPkgActions.clearUserPkg());
  }

  private initializeComponent(): void {
    this.loggedInUser$
      .pipe(
        takeUntil(this.destroy$),
        filter((user): user is User => user !== null)
      )
      .subscribe((user) => {
        this.currentUserId = user.id;
        this.loadKnowledgeGraph();
      });
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
      });
  }

  onVisibleNodesChanged(visibleNodes: any[]): void {
    if (!visibleNodes || visibleNodes.length === 0) {
      this.showUnderstoodLegend = false;
      this.showNotUnderstoodLegend = false;
      this.showUnknownLegend = false;
      this.showCourseLegend = false;
      this.cdr.detectChanges();
      return;
    }

    // Check what types of nodes are visible
    const hasUnderstood = visibleNodes.some((node: any) => 
      (node.type === 'main_concept' || node.type === 'related_concept') &&
      node.relationshipType === 'u'
    );
    
    const hasNotUnderstood = visibleNodes.some((node: any) => 
      (node.type === 'main_concept' || node.type === 'related_concept') &&
      node.relationshipType === 'dnu'
    );
    
    const hasUnknown = visibleNodes.some((node: any) => 
      (node.type === 'main_concept' || node.type === 'related_concept') &&
      (node.relationshipType === 'unknown' || !node.relationshipType)
    );
    
    const hasCourses = visibleNodes.some((node: any) => 
      node.type === 'course'
    );

    this.showUnderstoodLegend = hasUnderstood;
    this.showNotUnderstoodLegend = hasNotUnderstood;
    this.showUnknownLegend = hasUnknown;
    this.showCourseLegend = hasCourses;
    
    // Manually trigger change detection to update the view
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
    this.showConceptDetails = true;
    
    this.rawConceptRecords$
      .pipe(take(1))
      .subscribe((records) => {
        this.conceptDetails = this.extractConceptDetails(conceptData.cid, records);
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

  onEdgeClicked(edgeData: any): void {
    console.log('[User PKG] Edge clicked:', edgeData);
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
}
