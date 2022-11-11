import { Component, OnInit } from '@angular/core';
import { AnnotationService } from 'src/app/services/annotation.service';
import { ActiveAnnotation, Annotation } from 'src/app/model/comment';
import { NotificationServiceService } from 'src/app/services/notification-service.service';
import { MaterialsService } from 'src/app/services/materials.service';
import { ActiveMaterial } from 'src/app/model/material';

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
    private notificationService: NotificationServiceService,
    private materialService: MaterialsService
  ) {}
  ngOnInit(): void {
    // this.getMaterialAnnotations();
    this.materialService.activeMaterial$.subscribe(
      (activeMaterial: ActiveMaterial) => {
        this.getMaterialAnnotations(
          activeMaterial.courseId,
          activeMaterial.materialId
        );
      }
    );

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

  getMaterialAnnotations(courseId: string, materialId: string) {
    this.annotationService
      .getAnnotationsForMaterials(courseId, materialId)
      .subscribe((data: any) => {
        this.annotationService.annotations.next(data.annotations);
        this.annotations = data.annotations;
      });
  }
}
