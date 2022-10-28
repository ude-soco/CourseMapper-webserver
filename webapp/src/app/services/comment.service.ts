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
