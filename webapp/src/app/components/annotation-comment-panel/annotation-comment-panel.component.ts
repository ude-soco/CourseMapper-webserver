import { Component, Input, OnInit } from '@angular/core';
import { getInitials } from 'src/app/helper/getInitial';
import { ActiveAnnotation, Annotation, Comment } from 'src/app/model/comment';
import { AnnotationService } from 'src/app/services/annotation.service';
import { CommentService } from 'src/app/services/comment.service';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-annotation-comment-panel',
  templateUrl: './annotation-comment-panel.component.html',
  styleUrls: ['./annotation-comment-panel.component.css'],
})
export class AnnotationCommentPanelComponent implements OnInit {
  comments: Comment[];
  @Input() selectedAnnotation: ActiveAnnotation;
  constructor(
    private commentService: CommentService,
    private annotationService: AnnotationService,
    private notificationService: NotificationServiceService
  ) {}
  getInitials = getInitials;

  ngOnInit(): void {
    this.getAnnotationComments();

    this.annotationService.selectedAnnotation$.subscribe((activeAnnotation) => {
      console.log('when selected annotation changed', activeAnnotation);
      this.selectedAnnotation = activeAnnotation;
      this.getAnnotationComments();
    });
  }

  getAnnotationComments() {
    const courseId = '633ffce76076b6a2e67c3162';
    const annotationId = this.selectedAnnotation._id;

    console.log('selectedAnnotation', this.selectedAnnotation.content);
    this.commentService
      .getCommentsForAnnotation(courseId, annotationId)
      .subscribe((data: any) => {
        let temp = data.replies;
        this.commentService.comments.next(temp);
        this.comments = temp;
        console.log('comment', this.comments);
      });
  }

  closeDiscussion() {
    this.annotationService.isCommentVisible.next(false);
  }
}
