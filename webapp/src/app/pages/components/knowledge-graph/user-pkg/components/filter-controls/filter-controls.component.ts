import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ViewMode, AdvancedFilters } from '../../types/user-pkg.types';
import * as UserPkgActions from '../../state/user-pkg.actions';
import * as UserPkgSelectors from '../../state/user-pkg.reducer';
import { AdvancedFiltersDialogComponent, AdvancedFiltersResult } from '../advanced-filters-dialog/advanced-filters-dialog.component';

@Component({
  selector: 'app-pkg-filter-controls',
  templateUrl: './filter-controls.component.html',
  styleUrls: ['./filter-controls.component.css']
})
export class PkgFilterControlsComponent implements OnDestroy {
  private destroy$ = new Subject<void>();
  
  // Selectors from store
  viewMode$ = this.store.select(UserPkgSelectors.selectViewMode);
  searchQuery$ = this.store.select(UserPkgSelectors.selectSearchQuery);
  topNConcepts$ = this.store.select(UserPkgSelectors.selectTopNConcepts);
  understandingStatus$ = this.store.select(UserPkgSelectors.selectUnderstandingStatus);
  advancedFilters$ = this.store.select(UserPkgSelectors.selectAdvancedFilters);

  // Track if advanced filters are active
  hasActiveFilters = false;
  private currentFilters: AdvancedFilters | null = null;
  private dialogRef: DynamicDialogRef | null = null;

  readonly topNOptions = [
    { label: '15', value: 15 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: 'All', value: 'All' }
  ];
  
  readonly understandingStatusOptions = [
    { label: 'All', value: 'all' },
    { label: 'Understood', value: 'u' },
    { label: 'Not Understood', value: 'dnu' }
  ];

  constructor(
    private store: Store,
    private dialogService: DialogService
  ) {
    // Subscribe to advanced filters to track active state
    this.advancedFilters$
      .pipe(takeUntil(this.destroy$))
      .subscribe(filters => {
        this.currentFilters = filters;
        // Filters are "active" if they exist and have at least one slide selected
        // (slides are the most granular filter level)
        this.hasActiveFilters = !!(filters && filters.selectedSlideIds && filters.selectedSlideIds.length > 0);
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onViewModeChange(mode: ViewMode): void {
    this.store.dispatch(UserPkgActions.setViewMode({ viewMode: mode }));
  }

  onUnderstandingStatusChange(status: 'all' | 'u' | 'dnu'): void {
    this.store.dispatch(UserPkgActions.setUnderstandingStatus({ understandingStatus: status }));
  }

  onSearchQueryChange(query: string): void {
    this.store.dispatch(UserPkgActions.setSearchQuery({ searchQuery: query }));
  }

  onTopNChange(topN: number | 'All'): void {
    // TopN change requires reloading data from backend
    // This will be handled by the parent component which has the userId
    // For now, just update the filter state
    this.store.dispatch(UserPkgActions.setTopNConcepts({ topNConcepts: topN }));
  }

  openAdvancedFilters(): void {
    this.dialogRef = this.dialogService.open(AdvancedFiltersDialogComponent, {
      header: 'Advanced Filters',
      width: '500px',
      contentStyle: { 'max-height': '70vh', 'overflow': 'auto' },
      data: {
        currentFilters: this.currentFilters
      }
    });

    this.dialogRef.onClose.subscribe((result: AdvancedFiltersResult | null) => {
      if (result) {
        this.store.dispatch(UserPkgActions.setAdvancedFilters({
          selectedCourseIds: result.selectedCourseIds,
          selectedMaterialIds: result.selectedMaterialIds,
          selectedSlideIds: result.selectedSlideIds
        }));
      }
    });
  }

  clearAdvancedFilters(): void {
    this.store.dispatch(UserPkgActions.setAdvancedFilters({
      selectedCourseIds: [],
      selectedMaterialIds: [],
      selectedSlideIds: []
    }));
  }
}
