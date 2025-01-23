import { CourseImp } from 'src/app/models/CourseImp';
import { Course } from 'src/app/models/Course';
import { environment } from '../../environments/environment';
import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, catchError, Observable, of, Subject, tap, throwError } from 'rxjs';
import { TopicChannelService } from './topic-channel.service';
import { StorageService } from './storage.service';
import { Store } from '@ngrx/store';
import { State } from 'src/app/pages/components/materials/state/materials.reducer';
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import { Notification } from '../models/Notification';
import * as NotificationActions from '../pages/components/notifications/state/notifications.actions';
import { Socket } from 'ngx-socket-io';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private API_URL = environment.API_URL;
  private courses: Course[] = [];

  
  private queryParams = new BehaviorSubject<any>({
    page: 1,
    limit: 16,
    sort: '',
    roles: [],
    search: '',
  });

  $queryParams = this.queryParams.asObservable();
  // it is not private because it is subscribed in Sidebar component
  onUpdateCourses$ = new Subject<Course[]>();
  // it is not private because it is subscribed in chnannelbar component
  onSelectCourse = new EventEmitter<Course>();
  private selectedCourse: Course = new CourseImp('', '');
  public navigatingToMaterial: boolean = false;
  public Notification: Notification = null;

  constructor(
    private http: HttpClient,
    private topicChannelService: TopicChannelService,
    private storageService: StorageService,
    private store: Store<State>,
    private socket: Socket
  ) {}


  setQueryParams(params: any) {
    // If the parameters include search, sort, or roles, reset the page to 1
    if (params.search || params.sort || params.roles) {
      params.page = 1; // Reset page to 1
    }

    // Merge the existing query parameters with the new ones
    const updatedParams = { ...this.queryParams.value, ...params };
    this.queryParams.next(updatedParams); // Emit the updated parameters
    console.log(updatedParams, 'Updated query parameters');
  }

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
  selectCourse(course: Course) {
    this.socket.emit("leave", "course:" + this.getSelectedCourse()._id);
    this.socket.emit("join", "course:" + course._id);
    // if there is no selected course then no need to update the topics.
    if (this.getSelectedCourse()._id && course._id) {
      this.topicChannelService.updateTopics(course._id);
    }
    this.selectedCourse = course;
    let courseId = this.selectedCourse._id;
    this.store.dispatch(CourseActions.setCourseId({ courseId }));
    //2
    this.onSelectCourse.emit(course);
  }

  logCourses(courseId: string): Observable<any> {
    return this.http.get<Course>(`${this.API_URL}/courses/${courseId}/log`)
  }
  /**
   * @function fetchCourses
   * GET user's courses from the server
   *
   *
   */
  
 // fetchCourses(): Observable<Course[]> {
   // return this.http.get<Course[]>(`${this.API_URL}/my-courses`).pipe(
    //  tap((courses) => {
    //    this.courses = courses; // Store fetched courses
    //  }),
    //  catchError((error: HttpErrorResponse) => {
        // if (error.status === 401) {
        //   // console.warn("User is not authenticated. Token expired or not provided.");
        //   return of([]); // Return empty array so app continues
        // }
      //   return throwError(error); // Rethrow other errors
     // })
    //);
 // }


 fetchCourses(queryParams?: any): Observable<Course[]> {
  let url = `${this.API_URL}/my-courses`;

  if(typeof queryParams === 'object' &&  Object?.keys(queryParams)?.length > 0){
    url += `?page=${queryParams.page}&limit=${queryParams.limit}`
  };
  if (queryParams?.search) {
    url += `&search=${encodeURIComponent(queryParams.search)}`;
  }
  if (queryParams?.sort) {
    url += `&sort=${encodeURIComponent(queryParams.sort)}`;
  }
  if (queryParams?.roles && queryParams.roles?.length > 0) {
    // Join the roles array into a comma-separated string
    url += `&roles=${encodeURIComponent(queryParams.roles.join(','))}`;
  }

  return this.http.get<Course[]>(url).pipe(
    tap(({results}: any) => {
      this.courses = results; // Store fetched courses
    }),
    catchError((error: HttpErrorResponse) => {
      // if (error.status === 401) {
      //   // console.warn("User is not authenticated. Token expired or not provided.");
      //   return of([]); // Return empty array so app continues
      // }
      return throwError(error); // Rethrow other errors
    })
  );
}

/**


  /**
 * @function getCourse
 * GET courses details
 */

  getCourse(id: number | string): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.API_URL}/courses/${id}`)
  }
  /**
 * @function ToggleBlockUser
 * POST Block User
 */

 ToggleBlockUser(id: number | string, data: any) {
  return this.http.post<any>(`${this.API_URL}/course/${id}/block`, data);
}

ToggleBlockUserBetweenUsers(id: number | string, data: any) {
  return this.http.post<any>(`${this.API_URL}/course/${id}/blockBetweenUsers`, data);
}


  /**
 * @function updateUserRole
 * POST update User/Student Role
 */

  updateUserRole(courseId: string, data: Object): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/course/${courseId}/update-user-role`, data);
  }
  /**
 * @function updatePermissions
 * POST update Course Permissions
 */

  updatePermissions(courseId: string, data: Object): Observable<any> {
    return this.http.post<any>(`${this.API_URL}/course/${courseId}/update-user-permissions`, data);
  }

  /**
   * @function addCourse
   * Add new course in the backend and if the communication was
   * successfull it adds the course in the frontend
   *
   * @param {Course} course the course to be added
   *
   */
  addCourse(course: Course): any {
    return this.http
      .post<any>(`${this.API_URL}/course`, {
        courseName: course.name,
        courseDesc: course.description,
        shortname: course.shortName,
      })
      .pipe(
        catchError((err, sourceObservable) => {
          if (err.status === 403) {
            return of({ errorMsg: err.error.error });
          } else {
            return of({
              errorMsg: 'Error in connection: Please reload the application',
            });
          }
        }),
        tap((res) => {
          if (!('errorMsg' in res)) {
            this.courses = [...this.courses, res.courseSaved];
            this.store.dispatch(
              CourseActions.setCourseNotificationSettingsSuccess({
                updatedDoc: res.updatedNotificationSettings,
              })
            );
            //this.sendToOldBackend(res.courseSaved);
            this.onUpdateCourses$.next(this.courses);
          }
        })
      );
  }

  /**
   * @function deleteCourse
   * Delete a course in the backend
   *
   * @param {Course} courseTD the course to be deleted
   *
   */
  deleteCourse(courseTD: any): Observable<any> {
    return this.http
      .delete<any>(`${this.API_URL}/courses/${courseTD._id}`)
      .pipe(
        catchError((errResponse, sourceObservable) => {
          if (errResponse.status === 404) {
            return of({ errorMsg: errResponse.error.error });
          } else {
            return of({
              errorMsg: errResponse?.error?.message || 'Error in connection: Please reload the application',
            });
          }
        }),
        tap((res) => {
          if (!('errorMsg' in res)) {
            this.store.dispatch(
              NotificationActions.isDeletingCourse({
                courseId: courseTD._id,
              })
            );
            this.removeCourse(courseTD);
          }
        })
      );
  }

  /**
   * @function removeCourse
   * Delete a course from the frontend data model
   *
   * @param {Course} courseTD the course to be deleted
   *
   */
  removeCourse(courseTD: Course) {
    let index = this.courses.findIndex((course) => {
      return course._id === courseTD._id;
    });
    if (index !== -1) {
      let tempCourses = [...this.courses];
      tempCourses.splice(index, 1);
      this.courses = tempCourses;
      this.onUpdateCourses$.next(tempCourses);
      this.selectCourse(new CourseImp('', ''));
    }
  }

  renameCourse(courseTD: Course, body: any) {
    return this.http
      .put<any>(`${this.API_URL}/courses/${courseTD._id}`, body)
      .pipe(
        catchError((err, sourceObservable) => {
          return of({ errorMsg: err.error.error });
        }),
        tap((res) => {
          if (!('errorMsg' in res)) {
            // this.renameCourseSuccess(courseTD, body.name);
          }
        })
      );
  }

  renameCourseSuccess(renamedCourse, newName) {
    let cIndex = null;
    this.courses.map((course, i) => {
      if (course._id === renamedCourse._id) {
        cIndex = i;
      }
    });
    if (cIndex !== -1 && cIndex !== null) {
      this.courses[cIndex].name = newName;
      this.onUpdateCourses$.next(this.courses);
    }
  }
  //GetAllCourses(): Observable<Course[]> {
   // return this.http.get<Course[]>(`${this.API_URL}/courses`).pipe(
     // tap((courses) => {
       // this.courses = courses;
      //})
    //);
  //}

  GetAllCourses(queryParams?: any): Observable<Course[]> {
    let url = `${this.API_URL}/courses`;
    
    if(typeof queryParams === 'object' &&  Object?.keys(queryParams)?.length > 0){
      url += `?page=${queryParams.page}&limit=${queryParams.limit}`;
    };

    if (queryParams?.search) {
      url += `&search=${encodeURIComponent(queryParams.search)}`;
    }
    return this.http.get<Course[]>(url).pipe(
      tap(({results}: any) => {
        return this.courses = results;
      })
    );
  }

  EnrollToCOurse(courseID: string): any {
    try {
      return this.http.post<any>(`${this.API_URL}/enrol/${courseID}`, {}).pipe(
        catchError((errResponse, sourceObservable) => {
          if (errResponse.status === 403) {
            return of({ errorMsg: errResponse.error.error });
          } else {
            return of({
              errorMsg: 'Error in connection: Please reload the application',
            });
          }
        }),
        tap((Enrolcourses) => {
          console.log(Enrolcourses);
          this.store.dispatch(
            CourseActions.setCourseNotificationSettingsSuccess({
              updatedDoc: Enrolcourses.updatedNotificationSettings,
            })
          );
        })
      );
    } catch (error) {
      console.log(error.error);
    }
  }
  WithdrawFromCourse(course: Course): any {
    return this.http
      .post<any>(`${this.API_URL}/withdraw/${course._id}`, {})
      .pipe(tap((withdrawcourses) => {}));
  }
  // sendToOldBackend(course){
  //   // userId should be taken from the coockies. for the time being it is hard coded
  //   this.http.post<any>('http://localhost:8090/new/course',
  //   {_id: course._id, course: course.name, description: course.description,
  //     shortName: course.shortName, userID:   this.user.id,})
  //   .subscribe(res => {
  //
  //   });
  // }
}
