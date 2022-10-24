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
      .subscribe((courses) => (this.courses = courses));
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
  }

  onSelectCourse(selectedCourse: Course) {
    if (
      this.courseService.getSelectedCourse()._id.toString() !==
      selectedCourse._id.toString()
    ) {
      this.ngOnInit();
      let course = this.courses.find(
        (course: Course) => course === selectedCourse
      )!;
      this.selectedCourse = course;
      this.courseService.selectCourse(course);
    }

    this.courseService.getSubscribedCourseLists().subscribe((res: any) => {
      this.courseService.subscribedCourseLists.next(res);
    });
  }
}
