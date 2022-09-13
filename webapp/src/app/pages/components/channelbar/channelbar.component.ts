import { Topic } from './../../../models/Topic';
import { CourseService } from 'src/app/services/course.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { Component, OnInit } from '@angular/core';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';

@Component({
  selector: 'app-channelbar',
  templateUrl: './channelbar.component.html',
  styleUrls: ['./channelbar.component.css'],
})
export class ChannelbarComponent implements OnInit {
  constructor( private courseService: CourseService, private topicChannelService: TopicChannelService) {}
  selectedCourse: Course = new CourseImp('','');
  topics: Topic[]= [];

  ngOnInit(): void {
    this.selectedCourse = this.courseService.getSelectedCourse();        
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
    });    
    this.topicChannelService.fetchTopics(this.selectedCourse._id).subscribe((topics) => this.topics=topics);
    this.topicChannelService.onUpdateTopics$.subscribe((topics) => this.topics = topics);
  }

  deleteCourse() {
    this.courseService.deleteCourse(this.selectedCourse);
  }
}
