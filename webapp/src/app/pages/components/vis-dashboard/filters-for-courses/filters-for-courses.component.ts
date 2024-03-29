import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-filters-for-courses',
  templateUrl: './filters-for-courses.component.html',
  styleUrls: ['./filters-for-courses.component.css']
})
export class FiltersForCoursesComponent {
  @Output() filterChange: EventEmitter<any> = new EventEmitter();

  selectedRating: number | null = null;
  selectedLevel: string | null = null;
  selectedLanguage: string | null = null;
  selectedPrice: string | null = null;


  constructor() { }

  emitFilterChange(): void {
    const filterData = {
      rating: this.selectedRating,
      level: this.selectedLevel,
      language: this.selectedLanguage,
      price: this.selectedPrice
      // Add more filter properties as needed
    };
    this.filterChange.emit(filterData);
  }
}
