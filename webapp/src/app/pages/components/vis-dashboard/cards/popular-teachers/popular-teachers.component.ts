import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-popular-teachers',
  templateUrl: './popular-teachers.component.html',
  styleUrls: ['./popular-teachers.component.css']
})
export class PopularTeachersComponent {
  @Input() numCourses: number;
  @Input() teacherName: string;

}
