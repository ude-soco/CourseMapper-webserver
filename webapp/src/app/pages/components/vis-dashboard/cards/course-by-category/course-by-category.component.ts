import {Component, EventEmitter, Input, Output} from '@angular/core';
import {CourseByCategory} from "../../../../../services/vis-dashboard/vis-dashboard.service";

@Component({
  selector: 'app-course-by-category',
  templateUrl: './course-by-category.component.html',
  styleUrls: ['./course-by-category.component.css']
})
export class CourseByCategoryComponent {
  @Input() course: CourseByCategory;
  @Output() courseClick = new EventEmitter<string>();

  navigateToCourseDetails(courseId: string): void {
    this.courseClick.emit(courseId);
  }

}
