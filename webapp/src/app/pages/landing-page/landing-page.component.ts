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
import { Roles } from 'src/app/models/Roles';
import { ThisReceiver } from '@angular/compiler';
import { toggleShowHideAnnotation } from '../components/annotations/pdf-annotation/state/annotation.actions';



@Component({
  selector: 'app-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.css']
})
export class LandingPageComponent {
  ids: Array<number>= [1,2,3];
  // landingInfo: {
  //   courseName:string;
  //   shortName:string;
  //   createdAt:string;
  //   firstName:string;
  //   lastName:string;
  // };
 ;
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
  firstName:string ="";
  lastName:string="";
  
Users:any 
user:any
  firstNames:string [] = [];
  lastNames:string [] = [];
  Role:Roles
  Moderarors:User
  userArray: any = new Array()
  constructor( private storageService: StorageService,private courseService: CourseService, 
    private userService:UserServiceService, private router: Router, private store: Store<State>,)
  {
    this.loggedInUser = this.storageService.isLoggedIn();

    // const user = this.storageService.getUser();

    // this.username = user.username;

  }
  
  ngOnInit(){
    // this.currentUser = this.storageService.getUser();
    this.courseService.fetchCourses().subscribe( (courses1) => {
      this.myCourses=courses1
      console.log("my courses Rawaa", courses1)  
      
    
  })
      
    
    this.getAllCourses();
    
  }
  
   getAllCourses() {
    
console.log(this.firstNames, "print array" )
// this.firstNames.length = 0;
// this.lastNames.length = 0;
    this.courseService.GetAllCourses()
      .subscribe({next:
         async (courses) => {this.courses = courses;
     
        
       
      for (var course of this.courses){
        this.Users=[];
        console.log(course.name)

        // console.log( "print course details")
        // console.log( this.course)
       

       // this.createdAtDates.push(this.createdAt)
        this.Users=course.users
         console.log( "print course users")
         console.log(  this.Users)
        let userModerator=this.Users.find(user=> user.role.name==='moderator'  )
        console.log(userModerator, "before calling getuser Name")
       

              console.log("this.userArray")
              console.log(this.userArray)

      this.buildCardInfo(userModerator.userId,course)
        
             
      
        
  
     
       
      }
  
      // for (let moderator of this.Moderarors)
      // {
      //   console.log(moderator)
      //     this.userService.GetUserName(moderator.).subscribe((user)=> {
      //      console.log(user, "after calling getuser Name")
      //      console.log("service called form landing page")
      //  //   console.log(user.firstname)
      //    //  console.log(user.lastname)
      //      this.firstNames.push( user.firstname)
      //       console.log(this.firstNames.length,'this.names')
      //     //console.log("name pushed")
      //      this.lastNames.push( user.lastname)
      //    })
      // }
       

      console.log(this.firstNames,'this.names')
       console.log(this.lastNames,'this.lastnames')

        }
    });
       
  }

   buildCardInfo(userModeratorID: string, course:Course){
    console.log("course.createdAt")
    console.log(course.createdAt)
   
        this.userService.GetUserName(userModeratorID).subscribe( (user)=> {
                console.log(user, "after calling getuser Name")
                console.log("service called form landing page")
            //   console.log(user.firstname)
              //  console.log(user.lastname)
              this.firstName=user.firstname
              this.lastName=user.lastname
              //  this.firstNames.push( user.firstname)
                 console.log(this.firstNames)
               //console.log("name pushed")
             //   this.lastNames.push( user.lastname) 
             console.log(" now pushed")
              var index = course.createdAt.indexOf('T');
    this.createdAt=course.createdAt.slice(0, index), course.createdAt.slice(index + 1);
                let ingoPush={
                  id:course._id,
        name:course.name,
        shortName:course.shortName,
        createdAt:this.createdAt,
        firstName:this.firstName,
        lastName:this.lastName
      }
      this.userArray.push(ingoPush)
      console.log("  pushed eneded")
      
      
              })
  }
//   Search(){
    
//  this.updatedCourses = this.courses.find(obj => obj.name === this.value1);
//   //updatedCourses=coursesList
//     //this.hideImg=true
//     console.log(this.updatedCourses);
    
    
//   }
  onSelectCourse(selcetedCourseId:string)
  {
    let selcetedCourse=this.courses.find(course=> course._id==selcetedCourseId  )
    console.log("selcetedCourse")
    console.log(selcetedCourse)
    if(this.loggedInUser)
    {
    let varcc=this.myCourses.find(course=> selcetedCourseId === course._id  )
  
    
    console.log(varcc)
    if(varcc){
      this.Enrolled= true
      this.router.navigate(['course', selcetedCourseId]);
    }
    else
    {
      this.Enrolled= false
        this.store.dispatch(CourseAction.setCurrentCourse({selcetedCourse}));
    this.store.dispatch(CourseAction.setCourseId({ courseId:  selcetedCourseId}));  
    this.router.navigate(['course-description', selcetedCourseId]);
    console.log("course landing page")
    //console.log(selcetedCourse)
   
    }
    console.log(this.Enrolled)
    }
    else{
      this.store.dispatch(CourseAction.setCurrentCourse({selcetedCourse}));
    this.store.dispatch(CourseAction.setCourseId({ courseId:  selcetedCourseId}));  
    this.router.navigate(['course-description', selcetedCourseId]);
    }


  }
}