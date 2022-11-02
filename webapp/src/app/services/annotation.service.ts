import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ActiveAnnotation, Annotation, Comment } from 'src/app/model/comment';
import { HTTPOptions } from '../config/config';
@Injectable({
  providedIn: 'root',
})
export class AnnotationService {
  public annotations = new Subject<Annotation[]>();
  annotations$ = this.annotations.asObservable();

  public selectedAnnotation = new Subject<ActiveAnnotation>();
  selectedAnnotation$ = this.selectedAnnotation.asObservable();

  public isCommentVisible = new Subject<boolean>();
  isCommentVisible$ = this.isCommentVisible.asObservable();

  constructor(private http: HttpClient) {}

  getAnnotationsForMaterials(courseId: string, materialId?: string) {
    return this.http.get(
      environment.API_URL +
        '/courses/' +
        courseId +
        '/materials/' +
        materialId +
        '/annotations'
    );
  }

  closeDiscussion(courseId: string, annotationId: string) {
    return this.http.post(
      environment.API_URL +
        '/courses/' +
        courseId +
        '/annotations/' +
        annotationId +
        '/closeDiscussion',
      HTTPOptions
    );
  }
  getIsAnnotationClosed(courseId: string, annotationId: string) {
    return this.http.get(
      environment.API_URL +
        '/courses/' +
        courseId +
        '/annotations/' +
        annotationId +
        '/isAnnotationClosed',
      HTTPOptions
    );
  }

  checkReplyIfAuthor(courseId: string, annotationId: string) {
    return this.http.post(
      environment.API_URL +
        '/courses/' +
        courseId +
        '/annotations/' +
        annotationId +
        '/checkReplyToAuthor',
      HTTPOptions
    );
  }
}
