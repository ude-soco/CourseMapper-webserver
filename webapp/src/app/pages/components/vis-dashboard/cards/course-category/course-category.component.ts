import { Component,Input } from '@angular/core';

@Component({
  selector: 'app-course-category',
  templateUrl: './course-category.component.html',
  styleUrls: ['./course-category.component.css']
})
export class CourseCategoryComponent{
  @Input() text: string;

}
