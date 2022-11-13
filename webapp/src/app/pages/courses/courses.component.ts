import { Component, Input, OnInit } from '@angular/core';
import { MessageService } from 'primeng/api';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';
import { AnnotationService } from 'src/app/services/annotation.service';
import { CourseService } from 'src/app/services/course.service';
import { NotificationServiceService } from 'src/app/services/notification-service.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css'],
  providers: [MessageService],
})
export class CoursesComponent implements OnInit {
  selectedCourse: Course = new CourseImp('', '');
  @Input() hideContent: boolean;
  isCommentVisible: boolean;
  constructor(
    private courseService: CourseService,
    private topicChannelService: TopicChannelService,
    private annotationService: AnnotationService,
    private messageService: MessageService,
    private notificationService: NotificationServiceService
  ) {}

  ngOnInit(): void {
    this.selectedCourse = this.courseService.getSelectedCourse();
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
    });
    this.annotationService.isCommentVisible$.subscribe((isVisible) => {
      this.isCommentVisible = isVisible;
    });
    this.notificationService.turnOffUser$.subscribe((user) => {
      this.showSuccess(user);
    });
  }

  showSuccess(user: string) {
    this.messageService.add({
      severity: 'info',
      summary: 'Success',
      detail: `You have turned off notifications from ${user}`,
    });
  }
}
