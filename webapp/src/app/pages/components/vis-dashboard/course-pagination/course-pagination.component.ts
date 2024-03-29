import { Component,Input, Output, EventEmitter,OnInit} from '@angular/core';

@Component({
  selector: 'app-course-pagination',
  templateUrl: './course-pagination.component.html',
  styleUrls: ['./course-pagination.component.css']
})
export class CoursePaginationComponent implements OnInit{

  constructor() {
  }
  ngOnInit(): void {

  }
  @Input() currentPage: number;
  @Input() loadedCoursesCount: number;
  @Output() pageChange = new EventEmitter<number>();


  get pageSize(): number {
    return 5;
  }

  get totalPages(): number {
    return Math.ceil(this.loadedCoursesCount / this.pageSize);
  }

  get pages(): number[] {
    const maxPages = Math.min(this.totalPages, 10);
    const startPage = Math.max(1, this.currentPage - 2);
    const endPage = Math.min(this.totalPages, startPage + maxPages - 1);
    return Array.from({ length: (endPage - startPage) + 1 }, (_, i) => i + startPage);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  nextPage() {
    if (this.currentPage < this.loadedCoursesCount) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.loadedCoursesCount) {
      this.pageChange.emit(page);  }
  }


}
