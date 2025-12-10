import { Component, OnDestroy } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject, takeUntil, combineLatest } from 'rxjs';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ViewMode, AdvancedFilters } from '../../types/user-pkg.types';
import * as UserPkgActions from '../../state/user-pkg.actions';
import * as UserPkgSelectors from '../../state/user-pkg.reducer';
import { AdvancedFiltersDialogComponent, AdvancedFiltersResult } from '../advanced-filters-dialog/advanced-filters-dialog.component';
import { FilterProfile, CourseHierarchy } from '../advanced-filters-dialog/advanced-filters.types';

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

  // Active filter profile display
  activeProfileName: string | null = null;
  activeProfileSlideCount: number = 0;
  activeProfileTooltip: string = '';
  private profiles: FilterProfile[] = [];
  private courseHierarchy: CourseHierarchy[] = [];

  readonly topNOptions = [
    { label: '15', value: 15 },
    { label: '25', value: 25 },
    { label: '50', value: 50 },
    { label: '100', value: 100 },
    { label: 'All', value: 'All' }
  ];
  
  readonly understandingStatusOptions = [
    { label: 'All Concepts', value: 'all', icon: 'pi pi-circle' },
    { label: 'Understood', value: 'u', icon: 'pi pi-circle-fill' },
    { label: 'Not Understood', value: 'dnu', icon: 'pi pi-circle-fill' }
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

    // Subscribe to filter profiles and course hierarchy
    combineLatest([
      this.store.select(UserPkgSelectors.selectFilterProfiles),
      this.store.select(UserPkgSelectors.selectCourseHierarchy),
      this.advancedFilters$
    ])
      .pipe(takeUntil(this.destroy$))
      .subscribe(([profiles, hierarchy, filters]) => {
        this.profiles = profiles;
        this.courseHierarchy = hierarchy || [];
        this.updateActiveProfileDisplay(filters);
      });
  }

  private updateActiveProfileDisplay(filters: AdvancedFilters | null): void {
    if (!filters || !filters.selectedSlideIds || filters.selectedSlideIds.length === 0) {
      this.activeProfileName = null;
      this.activeProfileSlideCount = 0;
      this.activeProfileTooltip = '';
      return;
    }

    // Find matching profile
    const matchingProfile = this.profiles.find(profile => {
      if (profile.slideIds.length !== filters.selectedSlideIds!.length) return false;
      const profileSlideSet = new Set(profile.slideIds);
      return filters.selectedSlideIds!.every(id => profileSlideSet.has(id));
    });

    if (matchingProfile) {
      // Show saved profile name
      this.activeProfileName = matchingProfile.name;
      this.activeProfileSlideCount = matchingProfile.slideIds.length;
      this.activeProfileTooltip = this.buildProfileTooltip(matchingProfile);
    } else {
      // Show custom filter (no saved profile)
      this.activeProfileName = 'Active Filter';
      this.activeProfileSlideCount = filters.selectedSlideIds!.length;
      this.activeProfileTooltip = this.buildCustomFilterTooltip(filters.selectedSlideIds!);
    }
  }

  private buildProfileTooltip(profile: FilterProfile): string {
    const slidesByCourse = new Map<string, Map<string, string[]>>();
    
    profile.slideIds.forEach(slideId => {
      for (const course of this.courseHierarchy) {
        for (const material of course.materials) {
          const slide = material.slides.find(s => s.sid === slideId);
          if (slide) {
            if (!slidesByCourse.has(course._id)) {
              slidesByCourse.set(course._id, new Map());
            }
            const materialsMap = slidesByCourse.get(course._id)!;
            if (!materialsMap.has(material._id)) {
              materialsMap.set(material._id, []);
            }
            materialsMap.get(material._id)!.push(slide.cid);
            return;
          }
        }
      }
    });

    let tooltip = `<div class="text-sm"><strong>${profile.name}</strong><br/>`;
    tooltip += `<span class="text-gray-500">${profile.slideIds.length} slides selected</span><br/><br/>`;
    
    slidesByCourse.forEach((materialsMap, courseId) => {
      const course = this.courseHierarchy.find(c => c._id === courseId);
      if (course) {
        tooltip += `<strong>${course.name}</strong><br/>`;
        materialsMap.forEach((slideNumbers, materialId) => {
          const material = course.materials.find(m => m._id === materialId);
          if (material) {
            tooltip += `&nbsp;&nbsp;• ${material.name}: ${slideNumbers.length} slide(s)<br/>`;
          }
        });
      }
    });
    
    tooltip += '</div>';
    return tooltip;
  }

  private buildCustomFilterTooltip(slideIds: string[]): string {
    const slidesByCourse = new Map<string, Map<string, string[]>>();
    
    slideIds.forEach(slideId => {
      for (const course of this.courseHierarchy) {
        for (const material of course.materials) {
          const slide = material.slides.find(s => s.sid === slideId);
          if (slide) {
            if (!slidesByCourse.has(course._id)) {
              slidesByCourse.set(course._id, new Map());
            }
            const materialsMap = slidesByCourse.get(course._id)!;
            if (!materialsMap.has(material._id)) {
              materialsMap.set(material._id, []);
            }
            materialsMap.get(material._id)!.push(slide.cid);
            return;
          }
        }
      }
    });

    let tooltip = `<div class="text-sm"><strong>Active Filter</strong><br/>`;
    tooltip += `<span class="text-gray-500">${slideIds.length} slides selected</span><br/><br/>`;
    
    slidesByCourse.forEach((materialsMap, courseId) => {
      const course = this.courseHierarchy.find(c => c._id === courseId);
      if (course) {
        tooltip += `<strong>${course.name}</strong><br/>`;
        materialsMap.forEach((slideNumbers, materialId) => {
          const material = course.materials.find(m => m._id === materialId);
          if (material) {
            tooltip += `&nbsp;&nbsp;• ${material.name}: ${slideNumbers.length} slide(s)<br/>`;
          }
        });
      }
    });
    
    tooltip += '</div>';
    return tooltip;
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
      header: 'Filters',
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
