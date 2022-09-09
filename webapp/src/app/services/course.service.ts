import { Course } from 'src/app/models/Course';
import { environment } from './../../environments/environment';
import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom, map, Observable, Subject, tap } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class CourseService {
  courses : Course[] = [];
  coursesUpdate$ = new Subject<Course[]>();
  onSelectCourse = new EventEmitter<Course>();
  selectedCourse: Course = {
    _id: '',
    name: '',
    shortName: '',
    description: '',
    numberTopics: 0,
    notification: 0,
    numberChannels: 0,
    numberUsers: 0
  };
  
  

  private API_URL = environment.API_URL;
  constructor( private http: HttpClient) { }

  selectCourse(course: Course){
    this.selectedCourse = course;    
    this.onSelectCourse.emit(course);
  }

  /** GET courses from the server */
  fetchCourses():  Observable<Course[]> {
    return this.http.get<Course[]>(`${this.API_URL}/courses`).pipe(tap(courses => {
      this.courses = courses;
    }));
  }

  addCourse(course: Course){
    	this.courses.push(course);
      this.coursesUpdate$.next(this.courses);
  }
  // synchronizeCourses(){
  //   this.getCourses().subscribe(courses => {
  //     let userCourses = this.courses.map(course =>  course._id);
  //     courses.forEach(course => {
  //       if (!userCourses.includes(course._id)) this.courses.push(course);
  //     });
  //   });
  // }
  
  
  

}
