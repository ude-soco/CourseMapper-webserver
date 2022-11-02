import { Component, Input, OnInit } from '@angular/core';
import { getInitials } from 'src/app/helper/getInitial';
import { Annotation, Comment, User } from 'src/app/model/comment';
import { AnnotationService } from 'src/app/services/annotation.service';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-annotation-comment-list-item',
  templateUrl: './annotation-comment-list-item.component.html',
  styleUrls: ['./annotation-comment-list-item.component.css'],
})
export class AnnotationCommentListItemComponent implements OnInit {
  @Input() annotations!: Annotation[];
  getInitials = getInitials;

  constructor(
    private annotationService: AnnotationService,
    private notificationService: NotificationServiceService
  ) {}

  ngOnInit(): void {}

  openDiscussion(
    annotationContent: string,
    authorName: string,
    annotationId: string,
    author: User,
    closedAt: string,
    isClosed: boolean,
    courseId: string,
    materialId: string
  ) {
    this.annotationService.isCommentVisible.next(true);
    const annotation = {
      content: annotationContent,
      authorName: authorName,
      _id: annotationId,
      author: author,
      closedAt: closedAt,
      isClosed: isClosed,
      courseId: courseId,
      materialId: materialId,
    };
    this.annotationService.selectedAnnotation.next(annotation);
  }
}
