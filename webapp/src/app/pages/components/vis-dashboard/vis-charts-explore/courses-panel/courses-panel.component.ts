import { Component, EventEmitter, Input, OnChanges, Output, SimpleChanges } from '@angular/core';

@Component({
  selector: 'app-courses-panel',
  templateUrl: './courses-panel.component.html',
  styleUrls: ['./courses-panel.component.css']
})
export class CoursesPanelComponent implements OnChanges {
  // allow both numeric and string ids (scatter passes CourseId as string)
  @Input() selectedEntity: { id?: string | number; name: string } | null = null;
  @Input() courses: any[] = [];
  @Input() loading = false;

  // let the caller label this however they want (teacher / institution / category / course)
  @Input() entityLabel: string = 'teacher';

  // list paging
  @Input() pageSize = 10;

  // how many page buttons to show per band (one line)
  @Input() pagesPerBand = 20;

  @Output() back = new EventEmitter<void>();

  filterText = '';
  pageIndex = 1;            // 1-based
  totalFiltered = 0;
  totalPages = 0;
  displayedCourses: any[] = [];

  /** current page band [start..end], e.g. 1..20, 21..40, ... */
  get bandStart(): number {
    return Math.floor((this.pageIndex - 1) / this.pagesPerBand) * this.pagesPerBand + 1;
  }
  get bandEnd(): number {
    return Math.min(this.bandStart + this.pagesPerBand - 1, this.totalPages);
  }
  get visiblePages(): number[] {
    if (this.totalPages === 0) return [];
    const arr: number[] = [];
    for (let p = this.bandStart; p <= this.bandEnd; p++) arr.push(p);
    return arr;
  }
  get hasPrevBand(): boolean {
    return this.bandStart > 1;
  }
  get hasNextBand(): boolean {
    return this.bandEnd < this.totalPages;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedEntity'] || changes['courses']) {
      this.resetControls();
      this.applyFilterAndPage();
    }
  }

  private resetControls() {
    this.filterText = '';
    this.pageIndex = 1;
  }

  private applyFilterAndPage() {
    const q = (this.filterText || '').toLowerCase();
    const filtered = q
      ? (this.courses || []).filter(c =>
          (c.CourseName || c.name || '').toLowerCase().includes(q)
        )
      : (this.courses || []);

    this.totalFiltered = filtered.length;
    this.totalPages = this.totalFiltered > 0 ? Math.ceil(this.totalFiltered / this.pageSize) : 0;

    // clamp page index if filter shrinks the list
    if (this.pageIndex < 1) this.pageIndex = 1;
    if (this.totalPages > 0 && this.pageIndex > this.totalPages) this.pageIndex = this.totalPages;

    const start = (this.pageIndex - 1) * this.pageSize;
    this.displayedCourses = filtered.slice(start, start + this.pageSize);
  }

  // UI handlers
  onBackClick() { this.back.emit(); }

  onFilterInput(value: string) {
    this.filterText = value;
    this.pageIndex = 1;
    this.applyFilterAndPage();
  }

  setPage(n: number) {
    if (n < 1 || n > this.totalPages) return;
    this.pageIndex = n;
    this.applyFilterAndPage();
  }

  prevPage() {
    if (this.pageIndex > 1) {
      this.pageIndex--;
      this.applyFilterAndPage();
    }
  }

  nextPage() {
    if (this.pageIndex < this.totalPages) {
      this.pageIndex++;
      this.applyFilterAndPage();
    }
  }

  /** jump a whole band (20 pages) backward/forward */
  prevBand() {
    this.pageIndex = Math.max(1, this.bandStart - this.pagesPerBand);
    this.applyFilterAndPage();
  }
  nextBand() {
    this.pageIndex = Math.min(this.totalPages, this.bandEnd + 1);
    this.applyFilterAndPage();
  }

  trackByCourse = (_: number, c: any) =>
    c.CourseId ?? c.Id ?? c.id ?? c.CourseName ?? c.name;
}
