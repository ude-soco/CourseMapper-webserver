import { CourseImp } from 'src/app/models/CourseImp';
import { Course } from 'src/app/models/Course';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CourseService } from 'src/app/services/course.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  courses: Course[] = [];
  selectedCourse: Course = new CourseImp('', '');
  displayAddCourseDialogue: boolean = false;

  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.getCourses();
    
  }
  
  getCourses() {
    this.courseService
      .fetchCourses()
      .subscribe((courses) => (this.courses = courses ));
    this.courseService.onUpdateCourses$.subscribe(
      (courses) => (this.courses = courses)
      
    );
    //this.setDefaultselection();

  }

  // setDefaultselection(){
  //   if (this.courses.length > 0) {
  //     this.courseService.selectedCourse = this.courses[0];
  //     this.selectedCourse = this.courseService.selectedCourse;
  //   }
  // }
  
  onAddCourseDialogueClicked() {
    this.toggleAddCoursedialogue(true);
    
  }

  toggleAddCoursedialogue(visibility) {
    this.displayAddCourseDialogue = visibility;
    console.log(this.displayAddCourseDialogue);
  }
  
  onSelectCourse(selectedCourse: Course) {
   /* if (
      this.courseService.getSelectedCourse()._id.toString() !==
      selectedCourse._id.toString()
    ) {
      console.log("rrrr")
      console.log(selectedCourse);
      let course = this.courses.find(
        (course: Course) => course === selectedCourse
      )!;
      this.selectedCourse = course;
      //1
      this.courseService.selectCourse(course);
      console.log("nnn")
      console.log(course);

    }*/
    selectedCourse._id.toString();
    console.log("rrrr")

      console.log(selectedCourse);
      this.courseService.selectCourse(selectedCourse);
  }
}
