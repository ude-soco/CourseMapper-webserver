import { Course } from 'src/app/models/Course';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CourseService } from 'src/app/services/course.service';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  
  courses : Course[] = [];
  selectedCourse: Course = {
    _id: '',
    name: '',
    shortName: '',
    description: '',
    numberTopics: 0,
    notification: 0,
    numberChannels: 0,
    numberUsers: 0
  };
  displayAddCourseDialogue: boolean = false;
  onShowAddCourseDialogue = new EventEmitter<boolean>();

  constructor( private courseService: CourseService) { }

  ngOnInit(): void {
    this.getCourses();
  }

  getCourses(){
    this.courseService.getCourses().subscribe((courses) => {
      this.courseService.courses = courses;
      this.courses = this.courseService.courses;
      console.log(this.courseService.courses);
      
      //this.setDefaultselection();
    });
  }


  setDefaultselection(){
    if (this.courseService.courses.length > 0) {
      this.courseService.selectedCourse = this.courseService.courses[0];
      this.selectedCourse = this.courseService.selectedCourse;
    }
  }

  showAddCourseDialogue(){
    this.onShowAddCourseDialogue.emit(!this.displayAddCourseDialogue);
  }
  
  onSelect(selectedCourse: Course){
    if (this.courseService.selectedCourse != selectedCourse) {
      let course = this.courseService.courses.find((course: Course) => course == selectedCourse)!;
      this.selectedCourse = course;
      this.courseService.selectCourse(course);
      //this.courseService.selectedCourse = this.courseService.courses.find((course: Course) => course == selectedCourse)!;
    }  
  }
}
