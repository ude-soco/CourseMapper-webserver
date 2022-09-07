import { CourseService } from 'src/app/services/course.service';
import { Component, OnInit } from '@angular/core';
import { Course } from 'src/app/models/Course';

@Component({
  selector: 'app-channelbar',
  templateUrl: './channelbar.component.html',
  styleUrls: ['./channelbar.component.css'],
})
export class ChannelbarComponent implements OnInit {
  constructor( private courseService: CourseService) {}
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

  ngOnInit(): void {        
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
    });
  }

  showMenu() {
    console.log('showMenu');
  }
}
