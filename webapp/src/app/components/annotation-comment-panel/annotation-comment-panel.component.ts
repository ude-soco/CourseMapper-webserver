import { Component, Input, OnInit } from '@angular/core';
import { getInitials } from 'src/app/helper/getInitial';
import { ActiveAnnotation, Annotation, Comment } from 'src/app/model/comment';
import { ActiveMaterial } from 'src/app/model/material';
import { AnnotationService } from 'src/app/services/annotation.service';
import { CommentService } from 'src/app/services/comment.service';
import { CourseService } from 'src/app/services/course.service';
import { MaterialsService } from 'src/app/services/materials.service';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-annotation-comment-panel',
  templateUrl: './annotation-comment-panel.component.html',
  styleUrls: ['./annotation-comment-panel.component.css'],
})
export class AnnotationCommentPanelComponent implements OnInit {
  comments: Comment[];
  courseId: string;
  channelId: string;
  @Input() selectedAnnotation: ActiveAnnotation;
  constructor(
    private commentService: CommentService,
    private annotationService: AnnotationService,
    private materialService: MaterialsService,
    private notificationService: NotificationServiceService,
    private courseService: CourseService
  ) {}
  getInitials = getInitials;

  ngOnInit(): void {
    this.courseId = this.courseService.getSelectedCourse()._id;
    this.getAnnotationComments();

    this.annotationService.selectedAnnotation$.subscribe((activeAnnotation) => {
      this.selectedAnnotation = activeAnnotation;
      this.getAnnotationComments();
    });
  }

  getAnnotationComments() {
    const annotationId = this.selectedAnnotation._id;

    this.commentService
      .getCommentsForAnnotation(this.courseId, annotationId)
      .subscribe((data: any) => {
        let temp = data.replies;
        this.commentService.comments.next(temp);
        this.comments = temp;
      });
  }

  closeDiscussion() {
    this.annotationService.isCommentVisible.next(false);
  }
}
