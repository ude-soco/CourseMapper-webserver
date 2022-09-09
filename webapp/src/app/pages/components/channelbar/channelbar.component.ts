import { CourseService } from 'src/app/services/course.service';
import { Component, OnInit } from '@angular/core';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';

@Component({
  selector: 'app-channelbar',
  templateUrl: './channelbar.component.html',
  styleUrls: ['./channelbar.component.css'],
})
export class ChannelbarComponent implements OnInit {
  constructor( private courseService: CourseService) {}
  selectedCourse: Course = new CourseImp('','');

  ngOnInit(): void {        
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
    });
  }

  showMenu() {
    this.courseService.deleteCourse(this.selectedCourse)
  }
}
