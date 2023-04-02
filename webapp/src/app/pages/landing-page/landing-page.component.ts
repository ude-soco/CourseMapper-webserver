import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {  Store } from '@ngrx/store';
import { Course } from 'src/app/models/Course';
import { CourseService } from 'src/app/services/course.service';
import { StorageService } from 'src/app/services/storage.service';
import { State } from '../courses/state/course.reducer';

import * as CourseAction from 'src/app/pages/courses/state/course.actions'

@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  ids: Array<number>= [1,2,3]; ;
  courses: Array<Course> ;
  value1=""
  updatedCourses: any;
  currentUser: {} | undefined;
  isloggedin: boolean = false;
  hideImg:boolean=false;
  username?: string;
  constructor( private storageService: StorageService,private courseService: CourseService, private router: Router, private store: Store<State>,){}
  
  ngOnInit(){
    // this.currentUser = this.storageService.getUser();
    this.isloggedin = this.storageService.isLoggedIn();

      // const user = this.storageService.getUser();

      // this.username = user.username;
       console.log("this.username landing page")
      console.log(this.isloggedin)
      
    
    this.getAllCourses();
  }
  
  getAllCourses() {

    
    this.courseService.GetAllCourses()
      .subscribe({next:
         (courses) => {this.courses = courses;
      console.log("all courses from landing page")
      console.log(this.courses)
         }
    });
       
  }
  Search(){
    
 this.updatedCourses = this.courses.find(obj => obj.name === this.value1);
  //updatedCourses=coursesList
    //this.hideImg=true
    console.log(this.updatedCourses);
    
    
  }
  onSelectCourse(selcetedCourse:Course)
  {
    this.store.dispatch(CourseAction.setCurrentCourse({selcetedCourse}));
    this.store.dispatch(CourseAction.setCurrentCourseID({selcetedCourseID:selcetedCourse._id }));
    this.router.navigate(['course-description', selcetedCourse._id]);
    console.log("course landing page")
    console.log(selcetedCourse)
  }
}