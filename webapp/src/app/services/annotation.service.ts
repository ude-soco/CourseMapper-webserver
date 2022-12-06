import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { ActiveAnnotation, Annotation } from 'src/app/model/comment';
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

  public highlightAnnotations = new Subject<string[]>();
  highlightAnnotations$ = this.highlightAnnotations.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * @function getAnnotationsForMaterials
   * Get all annotations from specific materials
   *
   * @param {courseId} string id of the course
   * @param {materialId} string id of the material
   *
   */
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

  /**
   * @function closeDiscussion
   * Close a annotation discussion
   *
   * @param {courseId} string id of the course
   * @param {annotationId} string id of the annotation
   *
   */
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

  /**
   * @function getIsAnnotationClosed
   * Return the value of if a annotation is closed or not
   *
   * @param {courseId} string id of the course
   * @param {annotationId} string id of the annotation
   *
   */
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

  /**
   * @function checkReplyIfAuthor
   * Return all of the replies from a specific annotation
   *
   * @param {courseId} string id of the course
   * @param {annotationId} string id of the annotation
   *
   */
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
