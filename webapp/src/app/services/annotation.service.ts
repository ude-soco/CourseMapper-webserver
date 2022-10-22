import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Comment } from 'src/app/model/comment';
@Injectable({
  providedIn: 'root',
})
export class AnnotationService {
  public comments = new Subject<Comment[]>();
  comments$ = this.comments.asObservable();

  constructor(private http: HttpClient) {}
  ///courses/:courseId/annotations/:annotationId/replies
  getCommentsForAnnotation(
    courseId: string,
    annotationId?: string
  ): Observable<Comment[]> {
    return this.http.get<Comment[]>(
      environment.apiUrl +
        '/courses/' +
        courseId +
        '/annotations/' +
        annotationId +
        '/replies'
    );
  }
}
