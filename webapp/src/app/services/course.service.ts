import { CourseImp } from 'src/app/models/CourseImp';
import { Course } from 'src/app/models/Course';
import { environment } from './../../environments/environment';
import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, Observable, of, Subject, tap } from 'rxjs';
import { TopicChannelService } from './topic-channel.service';


@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private API_URL = environment.API_URL;
  private courses : Course[] = [];
  // it is not private because it is subscribed in Sidebar component
  onUpdateCourses$ = new Subject<Course[]>();
  // it is not private because it is subscribed in chnannelbar component
  onSelectCourse = new EventEmitter<Course>();
  private selectedCourse: Course = new CourseImp('','');


  constructor( private http: HttpClient, private topicChannelService : TopicChannelService) { }

  getSelectedCourse(): Course {
    return this.selectedCourse;
  }

  
  selectCourse(course: Course){
    // if there is no selected course then no need to update the topics.
    if (this.getSelectedCourse()._id && course._id){      
      this.topicChannelService.updateTopics(course._id);
    }
    this.selectedCourse = course;    
    this.onSelectCourse.emit(course);
  }

  /** GET courses from the server */
  fetchCourses():  Observable<Course[]> {
    return this.http.get<Course[]>(`${this.API_URL}/courses`).pipe(tap(courses => {
      this.courses = courses;
    }));
  }

  addCourse(course: Course) : any {
    return this.http.post<any>(`${this.API_URL}/course`, {name: course.name, description: course.description, shortname: course.shortName})
    .pipe(
      catchError(( err, sourceObservable) => {
       if (err.status ===  403) {
        return of({errorMsg: err.error.error });
       }else {
        return of({errorMsg: "Error in connection: Please reload the application" })
       }
    }),
      tap(res => {
        if ( !('errorMsg' in res) ){
          this.courses.push(res.courseSaved);
          this.onUpdateCourses$.next(this.courses);
        }
    }));
  }

  deleteCourse(courseTD: Course){
    let index = this.courses.findIndex((course) => {
      return course._id === courseTD._id
    });
    if (index !== -1) {
      this.courses.splice(index, 1);
      this.onUpdateCourses$.next(this.courses);
      this.selectCourse(new CourseImp('',''));
    }
  }

}
