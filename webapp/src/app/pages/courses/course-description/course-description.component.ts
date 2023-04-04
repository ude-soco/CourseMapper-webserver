import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/Course';
import { getCurrentCourse, getCurrentCourseID, State } from 'src/app/pages/courses/state/course.reducer';
import { StorageService } from 'src/app/services/storage.service';


@Component({
  selector: 'app-course-description',
  templateUrl: './course-description.component.html',
  styleUrls: ['./course-description.component.css']
})
export class CourseDescriptionComponent {
  Course:  Observable<Course> ;
  CourseId:  Observable<string> ;
  isloggedin: boolean = false;

  constructor(private storageService: StorageService, private store: Store<State>)
  {
    
    this.store.select(getCurrentCourse).subscribe((course) => console.log(course));
    this.store.select(getCurrentCourseID).subscribe((id) => console.log(id));
  }
  ngOnInit(): void {
    this.isloggedin = this.storageService.isLoggedIn();
//       this.store.select(getCurrentCourse).subscribe((data) => {
//   console.log("channel name observable called")
//   this.Course=data
//   console.log(this.Course)
// })


  }
}
