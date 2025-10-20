/*import { Component,OnInit } from '@angular/core';
import {ActivatedRoute} from "@angular/router";
import {VisDashboardService} from "../../../../services/vis-dashboard/vis-dashboard.service";
import {useToCamelCase} from "../../../../utils/useToCamelCase";

@Component({
  selector: 'app-explore-charts-page',
  templateUrl: './explore-charts-page.component.html',
  styleUrls: ['./explore-charts-page.component.css']
})
export class ExploreChartsPageComponent implements OnInit{
  platform:string

  constructor(private route: ActivatedRoute,
              private visDashboardService: VisDashboardService) {}
  ngOnInit(): void {
    this.platform = useToCamelCase(this.route.snapshot.paramMap.get('platform'));
  }


}*/
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VisDashboardService } from '../../../../services/vis-dashboard/vis-dashboard.service';
import { useToCamelCase } from '../../../../utils/useToCamelCase';

@Component({
  selector: 'app-explore-charts-page',
  templateUrl: './explore-charts-page.component.html',
  styleUrls: ['./explore-charts-page.component.css']
})
export class ExploreChartsPageComponent implements OnInit {
  platform: string;

  selectedTeacher: { id?: number; name: string } | null = null;
  selectedInstitution: { id?: number; name: string } | null = null;

  courses: any[] = [];
  displayedCourses: any[] = [];

  loading = false;

  // --- NEW: pagination state ---
  pageSize = 10;           // show 10 per page
  pageIndex = 1;           // 1-based index
  totalFiltered = 0;       // how many match current filter
  totalPages = 0;          // computed total pages

  // --- simple search filter over the list panel ---
  filterText = '';

  constructor(
    private route: ActivatedRoute,
    private visDashboardService: VisDashboardService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.platform = useToCamelCase(this.route.snapshot.paramMap.get('platform'));
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }


  // --- recompute visible list (filter + paginate) ---
  private recomputeDisplayed() {
    const q = (this.filterText || '').toLowerCase();

    const filtered = q
      ? this.courses.filter(c => (c.CourseName || c.name || '').toLowerCase().includes(q))
      : this.courses;

    this.totalFiltered = filtered.length;

    // compute total pages (at least 1 if we have any rows)
    this.totalPages = this.totalFiltered > 0
      ? Math.ceil(this.totalFiltered / this.pageSize)
      : 0;

    // clamp page index if filter shrinks the list
    if (this.pageIndex < 1) this.pageIndex = 1;
    if (this.totalPages > 0 && this.pageIndex > this.totalPages) this.pageIndex = this.totalPages;

    const start = (this.pageIndex - 1) * this.pageSize;
    const end = start + this.pageSize;

    this.displayedCourses = filtered.slice(start, end);
  }

  // --- reset list controls when changing teacher/institution ---
  private resetListControls() {
    this.filterText = '';
    this.pageIndex = 1;
  }

  // --- TEACHER selection flow ---
  onTeacherSelect(teacher: { id?: number; name: string }) {
    this.selectedTeacher = teacher;
    this.selectedInstitution = null;         // ensure only one context is active
    this.loading = true;
    this.resetListControls();

    const req = teacher.id != null
      ? this.visDashboardService.getTeacherCoursesForVisById(this.platform, teacher.id)
      : this.visDashboardService.getTeacherCoursesForVisByName(this.platform, teacher.name);

    req.then(rows => {
      this.courses = rows ?? [];
      this.recomputeDisplayed();
    })
    .catch(err => { console.error(err); this.courses = []; this.displayedCourses = []; this.totalFiltered = 0; this.totalPages = 0; })
    .finally(() => this.loading = false);
  }

  // --- INSTITUTION selection flow ---
  onInstitutionSelect(institution: { id?: number; name: string }) {
    this.selectedInstitution = institution;
    this.selectedTeacher = null;             // ensure only one context is active
    this.loading = true;
    this.resetListControls();

    const req = institution.id != null
      ? this.visDashboardService.getInstitutionCoursesForVisById(this.platform, institution.id)
      : this.visDashboardService.getInstitutionCoursesForVisByName(this.platform, institution.name);

    req.then(rows => {
      this.courses = rows ?? [];
      this.recomputeDisplayed();
    })
    .catch(err => { console.error(err); this.courses = []; this.displayedCourses = []; this.totalFiltered = 0; this.totalPages = 0; })
    .finally(() => this.loading = false);
  }

  // --- back from the panel ---
  onBack() {
    this.selectedTeacher = null;
    this.selectedInstitution = null;
    this.courses = [];
    this.displayedCourses = [];
    this.totalFiltered = 0;
    this.totalPages = 0;
    this.pageIndex = 1;
  }

  // --- open course details (router handles it; HTML version can use [routerLink] or (click)) ---
  onOpenCourse(courseId: string | number) {
    this.router.navigate(['/course-detail', courseId]);
  }

  // --- filter box input ---
  onFilterInput(value: string) {
    this.filterText = value;
    this.pageIndex = 1;               // NEW: restart at first page on new filter
    this.recomputeDisplayed();
  }

  // --- NEW: pagination helpers for the UI ---
  setPage(n: number) {
    if (n < 1 || n > this.totalPages) return;
    this.pageIndex = n;
    this.recomputeDisplayed();
  }

  prevPage() {
    if (this.pageIndex > 1) {
      this.pageIndex--;
      this.recomputeDisplayed();
    }
  }

  nextPage() {
    if (this.pageIndex < this.totalPages) {
      this.pageIndex++;
      this.recomputeDisplayed();
    }
  }

  // --- ngFor tracking ---
  trackByCourse = (_: number, c: any) =>
    c.CourseId ?? c.Id ?? c.id ?? c.CourseName ?? c.name;
}
