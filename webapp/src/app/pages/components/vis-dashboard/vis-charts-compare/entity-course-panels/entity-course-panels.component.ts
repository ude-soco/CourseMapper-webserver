import { Component, EventEmitter, Input, Output } from '@angular/core';

export type EntityMode = 'teacher' | 'institution';

export interface EntityItem {
  id: string | number;
  name: string;
  courseCount?: number;
}

export interface CourseItem {
  id?: string | number;
  name?: string;
  rank?: number;
  rating?: number;
  students?: number;

  /* possible backend aliases */
  CourseId?: string | number;
  CourseName?: string;
  Rating?: number | string;
  NumberOfParticipants?: number | string;
}

@Component({
  selector: 'app-entity-course-panels',
  templateUrl: './entity-course-panels.component.html',
  styleUrls: ['./entity-course-panels.component.css']
})
export class EntityCoursePanelsComponent {
  /** shorten names a bit earlier so Students always stays visible */
  readonly NAME_TRUNC = 22;

  /** search text shown in the header input (no FormsModule needed) */
  searchText = '';

  /* mode & label bits */
  @Input() mode: EntityMode = 'teacher';
  @Input() platformName = '';

  /* LEFT (entities) */
  @Input() entities: EntityItem[] = [];
  @Input() selectedEntityId: string | number | null = null;
  @Input() leftTotal = 0;
  @Input() leftPage = 1;
  @Input() leftPageSize = 10;

  /* RIGHT (courses) */
  @Input() courses: CourseItem[] = [];
  @Input() rightTotal = 0;
  @Input() rightPage = 1;
  @Input() rightPageSize = 5;

  /** pager window size */
  @Input() pagerWindow = 10;

  /** rating sort state (true = asc; false = desc) */
  sortAsc = true;

  /* outputs */
  @Output() entitySelected = new EventEmitter<EntityItem>();
  @Output() courseInspect  = new EventEmitter<CourseItem>();
  @Output() leftPageChange  = new EventEmitter<number>();
  @Output() rightPageChange = new EventEmitter<number>();
  @Output() sortCoursesByRating = new EventEmitter<'asc'|'desc'>();
  @Output() searchChanged = new EventEmitter<string>();

  /* labels & placeholders */
  get leftTitle(): string { return this.mode === 'institution' ? 'Institutions' : 'Teachers'; }
  get leftPlaceholder(): string {
    return this.mode === 'institution'
      ? 'Select a platform bar to see their institutions.'
      : 'Select a platform bar to see their teachers.';
  }
  get rightPlaceholder(): string {
    return this.mode === 'institution'
      ? 'Select an institution to see their courses.'
      : 'Select a teacher to see their courses.';
  }

  /* normalizers */
  getCourseId = (c: CourseItem) => c?.id ?? c?.CourseId ?? null;
  getCourseName = (c: CourseItem) => c?.name ?? c?.CourseName ?? '';
  getCourseRating = (c: CourseItem): number => {
    const r = (c?.rating ?? c?.Rating) as any;
    if (r === null || r === undefined || r === '') return 0;
    const n = typeof r === 'number' ? r : parseFloat(String(r).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  getCourseStudents = (c: CourseItem): number => {
    const s = (c as any)?.students ?? (c as any)?.NumberOfParticipants;
    if (s === null || s === undefined || s === '') return 0;
    return typeof s === 'number' ? s : Number(String(s).replace(/,/g, ''));
  };

  truncate(txt: string, n = this.NAME_TRUNC): string {
    if (!txt) return '';
    return txt.length > n ? txt.slice(0, n).trimEnd() + ' …' : txt;
  }

  /* trackBys */
  trackEntity = (_: number, e: EntityItem) => e.id;
  trackCourse = (_: number, c: CourseItem) => this.getCourseId(c) ?? this.getCourseName(c);

  /* actions */
  onSelectEntity(e: EntityItem) {
    this.selectedEntityId = e.id;
    this.entitySelected.emit(e);
  }
  onInspectCourse(c: CourseItem) {
    this.courseInspect.emit({
      id: this.getCourseId(c),
      name: this.getCourseName(c),
      rating: this.getCourseRating(c),
      students: this.getCourseStudents(c)
    });
  }

  /** called by the header search input */
  onSearch(ev: Event) {
    const q = (ev.target as HTMLInputElement)?.value ?? '';
    this.searchText = q;
    this.searchChanged.emit(q.trim());
  }

  setSort(dir: 'asc'|'desc') {
    this.sortAsc = dir === 'asc';
    this.sortCoursesByRating.emit(dir);
  }

  /* paging (windowed) */
  get leftPages(): number[] { return this.buildWindowedPages(this.leftTotal, this.leftPageSize, this.leftPage); }
  get rightPages(): number[] { return this.buildWindowedPages(this.rightTotal, this.rightPageSize, this.rightPage); }

  goLeft(page: number) {
    const max = Math.max(1, Math.ceil((this.leftTotal || 0) / Math.max(1, this.leftPageSize)));
    if (page < 1 || page > max || page === this.leftPage) return;
    this.leftPageChange.emit(page);
  }
  goRight(page: number) {
    const max = Math.max(1, Math.ceil((this.rightTotal || 0) / Math.max(1, this.rightPageSize)));
    if (page < 1 || page > max || page === this.rightPage) return;
    this.rightPageChange.emit(page);
  }

  private buildWindowedPages(total: number, size: number, current: number): number[] {
    const max = Math.max(1, Math.ceil((total || 0) / Math.max(1, size)));
    const win = Math.max(1, this.pagerWindow);
    const start = Math.floor((current - 1) / win) * win + 1;
    const end = Math.min(max, start + win - 1);
    const pages: number[] = [];
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  }

  jumpLeftWindow(delta: -1 | 1) {
    const win = Math.max(1, this.pagerWindow);
    this.goLeft(Math.max(1, this.leftPages[0] + delta * win));
  }
  jumpRightWindow(delta: -1 | 1) {
    const win = Math.max(1, this.pagerWindow);
    this.goRight(Math.max(1, this.rightPages[0] + delta * win));
  }

  /* visible slice for current page (5 items) */
  get pageCourses(): CourseItem[] {
    const start = (this.rightPage - 1) * this.rightPageSize;
    return (this.courses || []).slice(start, start + this.rightPageSize);
  }
}
