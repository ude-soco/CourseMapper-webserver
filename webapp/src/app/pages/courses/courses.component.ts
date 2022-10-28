import { Component, Input, OnInit } from '@angular/core';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';
import { AnnotationService } from 'src/app/services/annotation.service';
import { CourseService } from 'src/app/services/course.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css'],
})
export class CoursesComponent implements OnInit {
  selectedCourse: Course = new CourseImp('', '');
  @Input() hideContent: boolean;
  isCommentVisible: boolean;
  constructor(
    private courseService: CourseService,
    private topicChannelService: TopicChannelService,
    private annotationService: AnnotationService
  ) {}

  ngOnInit(): void {
    this.selectedCourse = this.courseService.getSelectedCourse();
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
    });
    this.annotationService.isCommentVisible$.subscribe((isVisible) => {
      this.isCommentVisible = isVisible;
    });
  }
}
