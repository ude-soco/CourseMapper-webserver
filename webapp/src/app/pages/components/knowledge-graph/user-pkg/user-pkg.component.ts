import { Component, OnInit, OnDestroy } from '@angular/core';
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
  
  // Concept details panel state
  selectedConcept: ConceptData | null = null;
  conceptDetails: ConceptDetail[] = [];
  showConceptDetails = false;

  constructor(
    private store: Store,
    private messageService: MessageService,
    private userConceptsService: UserConceptsService
  ) {}

  ngOnInit(): void {
    this.initializeComponent();
    this.subscribeToErrors();
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

  private loadKnowledgeGraph(): void {
    if (!this.currentUserId) return;

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
        this.conceptDetails = this.extractConceptDetails(conceptData.name, records);
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
    if (!conceptId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Error',
        detail: 'Concept ID not found',
      });
      return;
    }
    
    // Optimistic update in NgRx state
    this.store.dispatch(UserPkgActions.updateConceptStatus({ 
      conceptName: event.concept.name, 
      status: event.status 
    }));
    
    // Use safe single concept update (doesn't affect other concepts)
    this.userConceptsService.updateSingleConceptStatus(
      this.currentUserId,
      conceptId,
      event.status
    ).subscribe({
      next: () => {
        const statusMessage = event.status === 'u' ? 'understood' : 
                              event.status === 'dnu' ? 'not understood' : 'new';
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: `Concept "${event.concept.name}" marked as ${statusMessage}`,
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
  }

  onCourseNodeClicked(courseData: any): void {
    console.log('[User PKG] Course node clicked:', courseData);
  }

  onEdgeClicked(edgeData: any): void {
    console.log('[User PKG] Edge clicked:', edgeData);
  }

  // Extract concept details from raw records (inline helper)
  private extractConceptDetails(conceptName: string, rawConceptRecords: ConceptRecord[]): ConceptDetail[] {
    const conceptNameLower = conceptName.toLowerCase().trim();
    const details: ConceptDetail[] = [];
    
    rawConceptRecords.forEach(record => {
      if (record.name.toLowerCase().trim() === conceptNameLower) {
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
            relationshipType: record.relationshipType === 'u' || record.relationshipType === 'dnu' 
              ? record.relationshipType : undefined,
          });
        }
      }
    });
    
    return details;
  }
}
