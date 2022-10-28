import { Component, OnInit } from '@angular/core';
import { AnnotationService } from 'src/app/services/annotation.service';
import { ActiveAnnotation, Annotation } from 'src/app/model/comment';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-annotation-comment-list',
  templateUrl: './annotation-comment-list.component.html',
  styleUrls: ['./annotation-comment-list.component.css'],
})
export class AnnotationCommentListComponent implements OnInit {
  annotations!: Annotation[];
  newAnnotations!: Annotation[];
  lastTimeLoggedIn!: any;
  oldAnnotations!: Annotation[];
  isCommentVisible: boolean;
  selectedAnnotation: ActiveAnnotation;

  constructor(
    private annotationService: AnnotationService,
    private notificationService: NotificationServiceService
  ) {}
  ngOnInit(): void {
    this.getMaterialAnnotations();

    this.annotationService.annotations$.subscribe((annotations) => {
      this.annotations = annotations;
      this.updateAnnotations();
    });
    this.annotationService.isCommentVisible$.subscribe((isVisible) => {
      this.isCommentVisible = isVisible;
    });

    this.annotationService.selectedAnnotation$.subscribe(
      (selectedAnnotation) => {
        this.selectedAnnotation = selectedAnnotation;
      }
    );
  }

  updateAnnotations() {
    const lastTime = this.notificationService.getLoggedInTime();
    this.lastTimeLoggedIn = new Date(lastTime).toLocaleDateString();

    let newLists = [];
    let old = [];

    for (let i = 0; i < this.annotations.length; i++) {
      if (new Date(this.annotations[i].createdAt).getTime() > lastTime) {
        newLists.push(this.annotations[i]);
      } else {
        old.push(this.annotations[i]);
      }
    }
    this.newAnnotations = [...newLists];
    this.oldAnnotations = [...old];
  }

  getMaterialAnnotations() {
    const courseId = '633ffce76076b6a2e67c3162';
    const materialId = '63514cf661d005c29e6af9b4';

    this.annotationService
      .getAnnotationsForMaterials(courseId, materialId)
      .subscribe((data: any) => {
        // console.log('annotation lists', data.annotations);
        this.annotationService.annotations.next(data.annotations);
        this.annotations = data.annotations;
      });
  }
}
