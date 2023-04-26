import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Annotation, AnnotationLocationType, AnnotationTool, AnnotationType, PdfAnnotationTool, PdfGeneralAnnotationLocation } from 'src/app/models/Annotations';
import { environment } from 'src/environments/environment';
import { Material } from '../models/Material';
import { Reply } from '../models/Reply';
import { Channel } from '../models/Channel';
import { Tag } from '../models/Tag';

@Injectable({
  providedIn: 'root'
})
export class AnnotationService {

  constructor(private http: HttpClient) { }

  postAnnotation(annotation: Annotation): Observable<Annotation>{
    return this.http.post<Annotation>(`${environment.API_URL}/courses/${annotation.courseId}/materials/${annotation.materialID}/annotation`, annotation);
  }

  getAllAnnotations(materialId: string, courseID: string): Observable<Annotation[]>{
    return this.http.get<Annotation[]>(`${environment.API_URL}/courses/${courseID}/materials/${materialId}/getAnnotations`);
  }

  postReply(annotation: Annotation, reply: Reply): Observable<Reply>{
    return this.http.post<Reply>(`${environment.API_URL}/courses/${annotation.courseId}/annotations/${annotation._id}/reply`, reply);
  }

  getAllReplies(annotation: Annotation): Observable<Reply[]>{
    return this.http.get<Reply[]>(`${environment.API_URL}/courses/${annotation.courseId}/annotations/${annotation._id}/replies`);
  }

  likeAnnotation(annotation: Annotation): Observable<any>{
    return this.http.post<any>(`${environment.API_URL}/courses/${annotation.courseId}/annotations/${annotation._id}/like`, {});
  }

  dislikeAnnotation(annotation: Annotation): Observable<any>{
    return this.http.post<any>(`${environment.API_URL}/courses/${annotation.courseId}/annotations/${annotation._id}/dislike`, {});
  }

  likeReply(reply: Reply): Observable<any>{
    return this.http.post<any>(`${environment.API_URL}/courses/${reply.courseId}/replies/${reply._id}/like`, {});
  }

  dislikeReply(reply: Reply): Observable<any>{
    return this.http.post<any>(`${environment.API_URL}/courses/${reply.courseId}/replies/${reply._id}/dislike`, {});
  }

  deleteReply(reply: Reply): Observable<any>{
    return this.http.delete<any>(`${environment.API_URL}/courses/${reply.courseId}/replies/${reply._id}`, {});
  }

  editReply(reply: Reply, content: string): Observable<any>{
    return this.http.put<any>(`${environment.API_URL}/courses/${reply.courseId}/replies/${reply._id}`, {content});
  }

  deleteAnnotation(annotation: Annotation): Observable<any>{
    return this.http.delete<any>(`${environment.API_URL}/courses/${annotation.courseId}/annotations/${annotation._id}`, {});
  }

  editAnnotation(annotation: Annotation): Observable<any>{
    let type = annotation.type;
    let content = annotation.content;
    let location = annotation.location;
    let tool = annotation.tool;
    return this.http.put<any>(`${environment.API_URL}/courses/${annotation.courseId}/annotations/${annotation._id}`, {type, content, location, tool});
  }
}
