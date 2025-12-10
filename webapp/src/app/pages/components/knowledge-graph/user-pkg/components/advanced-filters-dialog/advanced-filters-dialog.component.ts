import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { DynamicDialogRef, DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Store } from '@ngrx/store';
import { CourseHierarchy, MaterialInfo } from './advanced-filters.types'
import { Subject, takeUntil, filter } from 'rxjs';
import * as UserPkgSelectors from '../../state/user-pkg.reducer';

export interface AdvancedFiltersResult {
  selectedCourseIds: string[];
  selectedMaterialIds: string[];
  selectedSlideIds: string[];
}

@Component({
  selector: 'app-advanced-filters-dialog',
  templateUrl: './advanced-filters-dialog.component.html',
  styleUrls: ['./advanced-filters-dialog.component.css']
})
export class AdvancedFiltersDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  
  loading = true;
  courses: CourseHierarchy[] = [];
  
  // Selection state - use arrays for simpler change detection
  selectedCourseIds: string[] = [];
  selectedMaterialIds: string[] = [];
  selectedSlideIds: string[] = [];
  
  // Cached computed values (updated when selections change)
  cachedAvailableMaterials: (MaterialInfo & { courseId: string; courseName: string; courseColor: string })[] = [];
  cachedAvailableSlides: { sid: string; cid: string; materialName: string; materialId: string; courseId: string; courseName: string; courseColor: string }[] = [];
  
  // Color palette for courses (consistent colors)
  private readonly courseColors = [
    '#3B82F6', // blue
    '#10B981', // green
    '#F59E0B', // amber
    '#EF4444', // red
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
    '#F97316', // orange
  ];
  
  // Expanded state for accordions
  coursesExpanded = false;
  materialsExpanded = false;
  slidesExpanded = false;

  constructor(
    public ref: DynamicDialogRef,
    public config: DynamicDialogConfig,
    private store: Store,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Load initial selections from config if provided
    const initialFilters = this.config.data?.currentFilters;
    if (initialFilters) {
      this.selectedCourseIds = [...(initialFilters.selectedCourseIds || [])];
      this.selectedMaterialIds = [...(initialFilters.selectedMaterialIds || [])];
      this.selectedSlideIds = [...(initialFilters.selectedSlideIds || [])];
    }
    
    // Subscribe to course hierarchy from store (already loaded when graph loaded)
    this.store.select(UserPkgSelectors.selectCourseHierarchy)
      .pipe(
        takeUntil(this.destroy$),
        filter(hierarchy => hierarchy !== null)
      )
      .subscribe(hierarchy => {
        this.courses = hierarchy as CourseHierarchy[];
        
        // If no selections, select all by default
        if (this.selectedCourseIds.length === 0) {
          this.selectAllCourses();
        }
        
        this.updateCachedValues();
        this.cdr.markForCheck();
      });
    
    // Subscribe to loading state
    this.store.select(UserPkgSelectors.selectCourseHierarchyLoading)
      .pipe(takeUntil(this.destroy$))
      .subscribe(loading => {
        this.loading = loading;
        this.cdr.markForCheck();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private selectAllCourses(): void {
    this.selectedCourseIds = this.courses.map(c => c._id);
    
    // Also select all materials and slides
    const allMaterials = this.courses.flatMap(c => c.materials);
    this.selectedMaterialIds = allMaterials.map(m => m._id);
    
    const allSlides = allMaterials.flatMap(m => m.slides);
    this.selectedSlideIds = allSlides.map(s => s.sid);
  }

  // Helper methods for array manipulation
  private hasId(arr: string[], id: string): boolean {
    return arr.includes(id);
  }

  private addId(arr: string[], id: string): void {
    if (!arr.includes(id)) {
      arr.push(id);
    }
  }

  private removeId(arr: string[], id: string): void {
    const index = arr.indexOf(id);
    if (index > -1) {
      arr.splice(index, 1);
    }
  }

  private updateCachedValues(): void {
    // Cache available materials based on selected courses with course info
    this.cachedAvailableMaterials = this.courses
      .filter(course => this.hasId(this.selectedCourseIds, course._id))
      .flatMap((course, courseIndex) => 
        course.materials.map(material => ({
          ...material,
          courseId: course._id,
          courseName: course.name,
          courseColor: this.getCourseColor(course._id)
        }))
      );
    
    // Cache available slides based on selected materials with course and material info
    this.cachedAvailableSlides = this.cachedAvailableMaterials
      .filter(material => this.hasId(this.selectedMaterialIds, material._id))
      .flatMap(material => 
        material.slides.map(slide => ({
          sid: slide.sid,
          cid: slide.cid,
          materialName: material.name,
          materialId: material._id,
          courseId: material.courseId,
          courseName: material.courseName,
          courseColor: material.courseColor
        }))
      );
    
    this.cdr.markForCheck();
  }
  
  // Get consistent color for a course
  getCourseColor(courseId: string): string {
    const index = this.courses.findIndex(c => c._id === courseId);
    return this.courseColors[index % this.courseColors.length];
  }
  
  // Extract slide number from slide ID (e.g., "68f608c578be571801792la7_slide_1" -> "1")
  getSlideNumber(slideId: string): string {
    const parts = slideId.split('_slide_');
    return parts.length > 1 ? parts[1] : slideId;
  }

  // Course selection methods
  get allCoursesSelected(): boolean {
    return this.courses.length > 0 && this.selectedCourseIds.length === this.courses.length;
  }

  toggleAllCourses(): void {
    if (this.allCoursesSelected) {
      // Clear all selections
      this.selectedCourseIds = [];
      this.selectedMaterialIds = [];
      this.selectedSlideIds = [];
    } else {
      // Select all courses and their materials/slides
      this.selectAllCourses();
    }
    this.updateCachedValues();
    this.cdr.markForCheck();
  }

  toggleCourse(courseId: string): void {
    const course = this.courses.find(c => c._id === courseId);
    if (!course) return;

    if (this.hasId(this.selectedCourseIds, courseId)) {
      // Unchecking course - remove it and all its materials/slides
      this.removeId(this.selectedCourseIds, courseId);
      
      // Remove all materials from this course
      course.materials.forEach(m => {
        this.removeId(this.selectedMaterialIds, m._id);
        
        // Remove all slides from this material
        m.slides.forEach(s => {
          this.removeId(this.selectedSlideIds, s.sid);
        });
      });
    } else {
      // Checking course - add it and all its materials/slides
      this.addId(this.selectedCourseIds, courseId);
      
      // Add all materials from this course
      course.materials.forEach(m => {
        this.addId(this.selectedMaterialIds, m._id);
        
        // Add all slides from this material
        m.slides.forEach(s => {
          this.addId(this.selectedSlideIds, s.sid);
        });
      });
    }
    
    // Update cached values and trigger change detection
    this.updateCachedValues();
    this.cdr.markForCheck();
  }

  isCourseSelected(courseId: string): boolean {
    return this.hasId(this.selectedCourseIds, courseId);
  }

  // Material selection
  get allMaterialsSelected(): boolean {
    const available = this.cachedAvailableMaterials;
    return available.length > 0 && available.every(m => this.hasId(this.selectedMaterialIds, m._id));
  }

  toggleAllMaterials(): void {
    const available = this.cachedAvailableMaterials;
    if (this.allMaterialsSelected) {
      // Uncheck all available materials and their slides
      available.forEach(m => {
        this.removeId(this.selectedMaterialIds, m._id);
        m.slides.forEach(s => this.removeId(this.selectedSlideIds, s.sid));
      });
    } else {
      // Check all available materials and their slides
      available.forEach(m => {
        this.addId(this.selectedMaterialIds, m._id);
        m.slides.forEach(s => this.addId(this.selectedSlideIds, s.sid));
      });
    }
    this.updateCachedValues();
    this.cdr.markForCheck();
  }

  toggleMaterial(materialId: string): void {
    const material = this.cachedAvailableMaterials.find(m => m._id === materialId);
    if (!material) return;

    if (this.hasId(this.selectedMaterialIds, materialId)) {
      // Unchecking material - remove it and all its slides
      this.removeId(this.selectedMaterialIds, materialId);
      material.slides.forEach(s => this.removeId(this.selectedSlideIds, s.sid));
    } else {
      // Checking material - add it and all its slides
      this.addId(this.selectedMaterialIds, materialId);
      material.slides.forEach(s => this.addId(this.selectedSlideIds, s.sid));
    }
    this.updateCachedValues();
    this.cdr.markForCheck();
  }

  isMaterialSelected(materialId: string): boolean {
    return this.hasId(this.selectedMaterialIds, materialId);
  }

  // Slide selection
  get allSlidesSelected(): boolean {
    const available = this.cachedAvailableSlides;
    return available.length > 0 && available.every(s => this.hasId(this.selectedSlideIds, s.sid));
  }

  toggleAllSlides(): void {
    const available = this.cachedAvailableSlides;
    if (this.allSlidesSelected) {
      available.forEach(s => this.removeId(this.selectedSlideIds, s.sid));
    } else {
      available.forEach(s => this.addId(this.selectedSlideIds, s.sid));
    }
    this.cdr.markForCheck();
  }

  toggleSlide(slideId: string): void {
    if (this.hasId(this.selectedSlideIds, slideId)) {
      this.removeId(this.selectedSlideIds, slideId);
    } else {
      this.addId(this.selectedSlideIds, slideId);
    }
    this.cdr.markForCheck();
  }

  isSlideSelected(slideId: string): boolean {
    return this.hasId(this.selectedSlideIds, slideId);
  }

  // Summary counts
  get selectedCoursesCount(): number {
    return this.selectedCourseIds.length;
  }

  get selectedMaterialsCount(): number {
    return this.selectedMaterialIds.length;
  }

  get selectedSlidesCount(): number {
    return this.selectedSlideIds.length;
  }

  // Actions
  cancel(): void {
    this.ref.close(null);
  }

  applyFilters(): void {
    const result: AdvancedFiltersResult = {
      selectedCourseIds: [...this.selectedCourseIds],
      selectedMaterialIds: [...this.selectedMaterialIds],
      selectedSlideIds: [...this.selectedSlideIds]
    };
    this.ref.close(result);
  }

  clearAll(): void {
    this.selectedCourseIds = [];
    this.selectedMaterialIds = [];
    this.selectedSlideIds = [];
    this.updateCachedValues();
    this.cdr.markForCheck();
  }
}
