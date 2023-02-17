import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Annotation } from 'src/app/models/Annotations';
import { environment } from 'src/environments/environment';
import { Material } from '../models/Material';
import { Reply } from '../models/Reply';

@Injectable({
  providedIn: 'root'
})
export class AnnotationService {

  constructor(private http: HttpClient) { }

  postAnnotation(annotation: Annotation): Observable<Annotation>{
    return this.http.post<Annotation>(`${environment.apiUrl}/courses/${annotation.courseId}/materials/${annotation.materialID}/annotation`, annotation);
  }

  getAllAnnotations(materialId: string, courseID: string): Observable<Annotation[]>{
    return this.http.get<Annotation[]>(`${environment.apiUrl}/courses/${courseID}/materials/${materialId}/getAnnotations`);
  }

  postReply(annotation: Annotation, reply: Reply): Observable<Reply>{
    return this.http.post<Reply>(`${environment.apiUrl}/courses/${annotation.courseId}/annotations/${annotation._id}/reply`, reply);
  }

  getAllReplies(annotation: Annotation): Observable<Reply[]>{
    return this.http.get<Reply[]>(`${environment.apiUrl}/courses/${annotation.courseId}/annotations/${annotation._id}/replies`);
  }

  likeAnnotation(annotation: Annotation): Observable<any>{
    return this.http.post<any>(`${environment.apiUrl}/courses/${annotation.courseId}/annotations/${annotation._id}/like`, {});
  }

  dislikeAnnotation(annotation: Annotation): Observable<any>{
    return this.http.post<any>(`${environment.apiUrl}/courses/${annotation.courseId}/annotations/${annotation._id}/dislike`, {});
  }

  likeReply(reply: Reply): Observable<any>{
    return this.http.post<any>(`${environment.apiUrl}/courses/${reply.courseId}/replies/${reply._id}/like`, {});
  }

  dislikeReply(reply: Reply): Observable<any>{
    return this.http.post<any>(`${environment.apiUrl}/courses/${reply.courseId}/replies/${reply._id}/dislike`, {});
  }
}
