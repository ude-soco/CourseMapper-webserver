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
  highlightAnnotations: string[] = [];
  constructor(
    private annotationService: AnnotationService,
    private notificationService: NotificationServiceService
  ) {}

  ngOnInit(): void {
    this.annotationService.highlightAnnotations$.subscribe((lists) => {
      this.highlightAnnotations = lists;
    });
  }

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
    // remove hight light style
    const index = this.highlightAnnotations.indexOf(annotationId);
    if (index > -1) {
      this.highlightAnnotations.splice(index, 1);
    }
  }
  turnOffNotification(userId, userName) {
    this.notificationService.turnOffNotification(userId).subscribe((data) => {
      this.notificationService.turnOffUser.next(userName);
    });
  }
}
