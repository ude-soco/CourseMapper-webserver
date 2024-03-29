import {Component, EventEmitter, Input, Output} from '@angular/core';
import { Router} from "@angular/router";

@Component({
  selector: 'app-course-category',
  templateUrl: './course-category.component.html',
  styleUrls: ['./course-category.component.css']
})
export class CourseCategoryComponent{
  @Input() category: string;
  @Output() cardClicked: EventEmitter<string> = new EventEmitter<string>();

  constructor(private router: Router) { }

  navigateToCategory(): void {
    this.cardClicked.emit(this.category);
    this.router.navigate(['course-category'], { queryParams: { category: this.category } });
  }




}
