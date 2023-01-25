import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, tap, throwError } from 'rxjs';
import { Annotation } from 'src/app/models/Annotations';
import { environment } from 'src/environments/environment';
import { Material } from '../models/Material';

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
}
