import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-recommendation-search',
  templateUrl: './recommendation-search.component.html',
  styleUrls: ['./recommendation-search.component.css'],
})
export class RecommendationSearchComponent {
  @Input() query = '';
  @Input() placeholder = 'Search courses';
  @Input() ariaLabel = 'Search recommendations';

  @Output() queryChange = new EventEmitter<string>();

  clearSearch() {
    this.query = '';
    this.queryChange.emit(this.query);
  }
}