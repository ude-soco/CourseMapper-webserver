import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {  Store } from '@ngrx/store';
import { Course } from 'src/app/models/Course';
import { CourseService } from 'src/app/services/course.service';
import { StorageService } from 'src/app/services/storage.service';
import { State } from '../courses/state/course.reducer';

import * as CourseAction from 'src/app/pages/courses/state/course.actions'
import { UserServiceService } from 'src/app/services/user-service.service';
import { User } from 'src/app/modules/primeng/UserModule';


@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  ids: Array<number>= [1,2,3]; ;
  courses: Array<Course> ;
  i:number
  value1=""
  course1: any
  noCOurse:boolean =false
  updatedCourses: any;
  currentUser: {} | undefined;
  loggedInUser: boolean = false;
  hideImg:boolean=false;
  username?: string;
  CourseDes:string;
  myCourses:Course[]
  Enrolled:boolean=false;
  createdAt:string
  createdAtDates:string[] = [];
  firstName:string;
  lastName:string;
  course:Course;
  User:User
  firstNames:string [] = [];
  lastNames:string [] = [];
  constructor( private storageService: StorageService,private courseService: CourseService, 
    private userService:UserServiceService, private router: Router, private store: Store<State>,)
  {
    this.loggedInUser = this.storageService.isLoggedIn();

    // const user = this.storageService.getUser();

    // this.username = user.username;
     console.log("this.username landing page")
    console.log(this.loggedInUser)
  }
  
  ngOnInit(){
    // this.currentUser = this.storageService.getUser();
    this.courseService.fetchCourses().subscribe( (courses) => {
      this.myCourses=courses
      console.log("my courses Rawaa", courses)  
      
    
  })
      
    
    this.getAllCourses();
    
  }
  
  getAllCourses() {

    
    this.courseService.GetAllCourses()
      .subscribe({next:
         (courses) => {this.courses = courses;
        

      console.log("all courses from landing page")
      console.log(this.courses)
      for (var course of this.courses){
        this.course=course
        var index = course.createdAt.indexOf('T');
        this.createdAt=course.createdAt.slice(0, index), course.createdAt.slice(index + 1);
        console.log(this. createdAt)
        console.log(course.users[0].userId)
        console.log( course.users[0].role)
        this.createdAtDates.push(this.createdAt)
     
       //  this.materialService.deleteMaterial(this.selectedMaterial).subscribe({
       //   next: (data) => {
       this.userService.GetUserName(course.users[0].userId).subscribe({
         next:(user) =>{
          this.User=user
          this.User.firstname
           this.firstName=user.firstname
           this.lastName=user.lastname
           console.log( this.firstName)
           console.log( this.lastName)
           this.firstNames.push(user.firstname)
           this.lastNames.push(user.lastname)
         }
       
       }
       
       )
       
       console.log(this.firstNames,'this.names')
       console.log(this.lastNames,'this.names')
      }
         
        }
    });
       
  }
//   Search(){
    
//  this.updatedCourses = this.courses.find(obj => obj.name === this.value1);
//   //updatedCourses=coursesList
//     //this.hideImg=true
//     console.log(this.updatedCourses);
    
    
//   }
  onSelectCourse(selcetedCourse:Course)
  {
    let varcc=this.myCourses.find(course=> selcetedCourse._id === course._id  )
  
    
    console.log(varcc)
    if(varcc){
      this.Enrolled= true
      this.router.navigate(['course', selcetedCourse._id]);
    }else{
      this.Enrolled= false
        this.store.dispatch(CourseAction.setCurrentCourse({selcetedCourse}));
    this.store.dispatch(CourseAction.setCourseId({ courseId:  selcetedCourse._id}));  
    this.router.navigate(['course-description', selcetedCourse._id]);
    console.log("course landing page")
    console.log(selcetedCourse)
   
    }
    console.log(this.Enrolled)

  }
}