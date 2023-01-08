import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Annotation } from 'src/assets/Data/Annotations';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnnotationService {

  constructor(private http: HttpClient) { }

  postAnnotation(annotation: Annotation){
    return this.http.post<Annotation>(`${environment.apiUrl}courses/${annotation.courseId}/materials/${annotation.materialID}`, annotation);
  }
}
