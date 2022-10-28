import { Component, Input, OnInit } from '@angular/core';
import { getInitials } from 'src/app/helper/getInitial';
import { ActiveAnnotation, Annotation, Comment } from 'src/app/model/comment';
import { AnnotationService } from 'src/app/services/annotation.service';
import { NotificationServiceService } from 'src/app/services/notification-service.service';
import { StorageService } from 'src/app/services/storage.service';

@Component({
  selector: 'app-comment-list',
  templateUrl: './comment-list.component.html',
  styleUrls: ['./comment-list.component.css'],
})
export class CommentListComponent implements OnInit {
  @Input() comments: Comment[];
  @Input() activeAnnotation: ActiveAnnotation;
  showCloseButton: boolean;
  afterClosed: boolean;
  constructor(
    private annotationService: AnnotationService,
    private notificationService: NotificationServiceService,
    private storageService: StorageService
  ) {}
  getInitials = getInitials;

  ngOnInit(): void {
    this.checkIfAuthor();
  }
  checkIfAuthor() {
    const user = this.storageService.getUser();
    if (user.id == this.activeAnnotation.author.userId) {
      this.showCloseButton = true;
    } else {
      this.showCloseButton = false;
    }
  }
  closeDiscussion(annotation: ActiveAnnotation) {
    console.log(this.activeAnnotation.closedAt);
    this.annotationService
      .closeDiscussion('633ffce76076b6a2e67c3162', annotation._id)
      .subscribe((data) => {
        this.getMaterialAnnotations();
        this.showCloseButton = false;
        this.afterClosed = true;
      });
  }

  getMaterialAnnotations() {
    const courseId = '633ffce76076b6a2e67c3162';
    const materialId = '63514cf661d005c29e6af9b4';

    this.annotationService
      .getAnnotationsForMaterials(courseId, materialId)
      .subscribe((data: any) => {
        this.annotationService.annotations.next(data.annotations);
      });
  }
}
