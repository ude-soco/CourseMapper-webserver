import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CommentService {
  public comments = new Subject<Comment[]>();
  comments$ = this.comments.asObservable();
  constructor(private http: HttpClient) {}

  /**
   * @function getCommentsForAnnotation
   * Return all of the replies from a specific annotation
   *
   * @param {courseId} string id of the course
   * @param {annotationId} string id of the annotation
   *
   */
  getCommentsForAnnotation(
    courseId: string,
    annotationId?: string
  ): Observable<Comment[]> {
    return this.http.get<Comment[]>(
      environment.API_URL +
        '/courses/' +
        courseId +
        '/annotations/' +
        annotationId +
        '/replies'
    );
  }
}
