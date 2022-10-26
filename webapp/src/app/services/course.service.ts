import { CourseImp } from 'src/app/models/CourseImp';
import { Course } from 'src/app/models/Course';
import { environment } from '../../environments/environment';
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

  /**
   * @function selectCourse 
   * set selected course
   *
   * @param {Course} course the course to be selected
   * 
   */ 
  selectCourse(course: Course){
    // if there is no selected course then no need to update the topics.
    if (this.getSelectedCourse()._id && course._id){      
      this.topicChannelService.updateTopics(course._id);
    }
    this.selectedCourse = course;    
    this.onSelectCourse.emit(course);
  }

  /**
   * @function fetchCourses 
   * GET user's courses from the server 
   *
   * 
   */
  fetchCourses():  Observable<Course[]> {
    return this.http.get<Course[]>(`${this.API_URL}/my-courses`).pipe(tap(courses => {
      this.courses = courses;
    }));
  }

  /**
   * @function addCourse 
   * Add new course in the backend and if the communication was 
   * successfull it adds the course in the frontend
   *
   * @param {Course} course the course to be added
   * 
   */
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
          this.sendToOldBackend(res.courseSaved);
          this.onUpdateCourses$.next(this.courses);
        }
    }));
  }


  /**
   * @function deleteCourse
   * Delete a course in the backend
   *
   * @param {Course} courseTD the course to be deleted
   * 
   */
  deleteCourse(courseTD: Course){
    return this.http.delete<any>(`${this.API_URL}/courses/${courseTD._id}`)
    .pipe(
      catchError(( errResponse, sourceObservable) => {
        if (errResponse.status ===  404) {
          return of({errorMsg: errResponse.error.error });
         }else {        
          return of({errorMsg: "Error in connection: Please reload the application" })
         }
      }),
      tap( res => {
        if ( !('errorMsg' in res) ){
          this.removeCourse(courseTD);
        }
      }));
  }

  /**
   * @function removeCourse
   * Delete a course from the frontend data model
   *
   * @param {Course} courseTD the course to be deleted
   * 
   */
  removeCourse(courseTD: Course){
    let index = this.courses.findIndex((course) => {
      return course._id === courseTD._id
    });
    if (index !== -1) {
      this.courses.splice(index, 1);
      this.onUpdateCourses$.next(this.courses);
      this.selectCourse(new CourseImp('',''));
    }
  }

  renameCourse(courseTD: Course, body: any){
    return this.http.put<any>(`${this.API_URL}/courses/${courseTD._id}`,body)
    .pipe(
      catchError(( err, sourceObservable) => {
        return of({errorMsg: err.error.error });
      }),
      tap(res => {
        if ( !('errorMsg' in res) ){
          this.renameCourseSuccess(courseTD,body.name)
        }
    })
    )
  }

  renameCourseSuccess(renamedCourse,newName){
    let cIndex = null;
    this.courses.map((course, i) => {
      if (course._id === renamedCourse._id){
        cIndex = i;
      }
    });
    if (cIndex !== -1 && cIndex !== null) {
      this.courses[cIndex].name=newName;
      this.onUpdateCourses$.next(this.courses);
    }
  }

  sendToOldBackend(course){
    // userId should be taken from the coockies. for the time being it is hard coded
    this.http.post<any>('http://localhost:8090/new/course', 
    {_id: course._id, course: course.name, description: course.description, 
      shortName: course.shortName, userID: '633d5bc0f15907e2f211b1ea',})
    .subscribe(res => {
      console.log(res);
    });
  }
}
