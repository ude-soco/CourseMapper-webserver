import { Component, Input, OnInit } from '@angular/core';
import { getInitials } from 'src/app/helper/getInitial';
import { ActiveAnnotation, Annotation, Comment } from 'src/app/model/comment';
import { ActiveMaterial } from 'src/app/model/material';
import { AnnotationService } from 'src/app/services/annotation.service';
import { CourseService } from 'src/app/services/course.service';
import { MaterialsService } from 'src/app/services/materials.service';
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
  isClosed: boolean;
  courseId: string;
  materialId: string;
  constructor(
    private annotationService: AnnotationService,
    private notificationService: NotificationServiceService,
    private storageService: StorageService,
    private courseService: CourseService,
    private materialService: MaterialsService
  ) {}
  getInitials = getInitials;

  ngOnInit(): void {
    this.courseId = this.courseService.getSelectedCourse()._id;
    this.materialService.activeMaterial$.subscribe(
      (activeMaterial: ActiveMaterial) => {
        this.materialId = activeMaterial.materialId;
        this.getMaterialAnnotations(
          activeMaterial.courseId,
          activeMaterial.materialId
        );
      }
    );

    this.annotationService.selectedAnnotation$.subscribe(
      (activeAnnotation: ActiveAnnotation) => {
        this.activeAnnotation = activeAnnotation;
        this.checkIfAuthor();
        this.courseId = activeAnnotation.courseId;
        this.getIfAnnotationClosed(this.courseId);
        this.materialId = activeAnnotation.materialId;
        console.log('materialId', this.materialId);
      }
    );
    this.checkIfAuthor();
    this.getIfAnnotationClosed(this.courseId);
  }

  getIfAnnotationClosed(courseId: string) {
    this.annotationService
      .getIsAnnotationClosed(courseId, this.activeAnnotation._id)
      .subscribe((res: any) => {
        this.isClosed = res.isAnnotationClosed;
      });
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
    console.log('materialId close', this.materialId);

    this.annotationService
      .closeDiscussion(this.courseId, annotation._id)
      .subscribe((data) => {
        this.getMaterialAnnotations(this.courseId, this.materialId);
        this.getIfAnnotationClosed(this.courseId);
      });
  }

  getMaterialAnnotations(courseId: string, materialId: string) {
    this.annotationService
      .getAnnotationsForMaterials(courseId, materialId)
      .subscribe((data: any) => {
        this.annotationService.annotations.next(data.annotations);
      });
  }
}
