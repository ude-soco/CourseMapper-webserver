import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { Course } from '../models/Course';
import { Material } from '../models/Material';

@Injectable({
  providedIn: 'root'
})
export class MaterialKgOrderedService {

  constructor() { }

  private subjectMaterial = new Subject<any>();
  private subjectCourse = new Subject<any>();
  public selectedCourseService:Course
  public selectedMaterialService:Material

  materialKgOrdered(material){
    this.subjectMaterial.next(true);
    this.selectedMaterialService=material
  }
  generateMaterialKG():Observable<any>{
    return this.subjectMaterial.asObservable();
  }
  courseKgOrdered(course){
    this.subjectCourse.next(course);
    this.selectedCourseService=course
  }
  generateCourseKG():Observable<any>{
    return this.subjectCourse.asObservable();
  }
}
