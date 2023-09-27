import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {  Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/Course';
import { CourseService } from 'src/app/services/course.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import { getCurrentCourse, getCurrentCourseId, State } from '../../courses/state/course.reducer';
import * as  CourseActions from 'src/app/pages/courses/state/course.actions'
import { MessageService } from 'primeng/api';



@Component({
  selector: 'app-course-description',
  templateUrl: './course-description.component.html',
  styleUrls: ['./course-description.component.css']
})
export class CourseDescriptionComponent {
  course:  any ;
  CourseId:  Observable<string> ;
  isloggedin: boolean = false;
  createdAt:string
  firstName:string;
  lastName:string;
  Enrolled:boolean=false;
  Users: any;
  course_enroll:Course;
  
  constructor(private storageService: StorageService, 
    private store: Store<State>, 
    private userService:UserServiceService, 
    private courseService: CourseService,
    private router: Router,
    private messageService: MessageService,
    )
  {
    
    this.store.select(getCurrentCourse).subscribe((course) => 
    this.course=course);
    //console.log(this.course, "this.course course des page")

   this.courseService.GetAllCourses().subscribe( (courses) => {
    //console.log("course desc All courses ", courses)  
   let varcc=courses.find(course=> this.course.id === course._id || this.course._id === course._id  )
 
   this.Users = [];
  //console.log(varcc, "course found from des page")
   this.Users = varcc.users;
   var index = varcc.createdAt.indexOf('T');
      (this.createdAt = varcc.createdAt.slice(0, index)),
      varcc.createdAt.slice(index + 1);
   let userModerator = this.Users.find(
     (user) => user.role.name === 'moderator'
   );

   this.buildCardInfo(userModerator.userId, this.course);

 })
  
//     this.store.select(getCurrentCourseId).subscribe((id) => console.log(id));
  }
  ngOnInit(): void {
    this.isloggedin = this.storageService.isLoggedIn();
 



  }
  getName(firstName: string, lastName: string) {
let Name=firstName+" "+lastName
    return Name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }
  buildCardInfo(userModeratorID: string, course: Course) {
    this.userService.GetUserName(userModeratorID).subscribe((user) => {
      this.firstName = user.firstname;
      this.lastName = user.lastname;

      

    
    });
  }
  
  EnrollToCOurse(){
    if (this.isloggedin== false){
      console.log(this.course, "this.course")
      this.store.dispatch(CourseActions.setCurrentCourse({selcetedCourse: this.course}));
      this.router.navigate(['login']);
    }
    else if (this.isloggedin== true) {
      
      console.log("this.course.id", this.course.id)
      this.store.select(getCurrentCourse).subscribe((data) => {
        console.log("channel name observable called")
        this.course_enroll=data
        console.log(this.course_enroll, "data from ongoninit before")
      })
      console.log(this.course_enroll, "data from ongoninit after")
      if(this.course.id == null )
      {
        console.log("entered")
        this.courseService.EnrollToCOurse(this.course_enroll._id).subscribe(
          (data) => {
           this.Enrolled= true
           console.log( "response after calling the service", data)
           if ('success' in data) {
            console.log("entered success msg")
            // this.showInfo(res.success);
            this.showInfo('You are successfully enrolled to the course');
          } else {
            this.showError(data.errorMsg);
          }
          setTimeout(() => {
            this.router.navigate(['course', this.course_enroll._id]);
          }, 850);
           
            
          })
      }
      else{
        this.courseService.EnrollToCOurse(this.course.id).subscribe(
          (data) => {
           this.Enrolled= true
           console.log( "data", data)
           //if ( "write something here".indexOf("write som") > -1 )  { alert( "found it" );  } 
          
           if ('success' in data) {
            console.log("entered success msg")
            // this.showInfo(res.success);
            this.showInfo('You are successfully enrolled to the course');
          } else {
            this.showError(data.errorMsg);
          }
          setTimeout(() => {
            this.router.navigate(['course', this.course.id]);
          }, 850);
        
            
          })
      }
      
 
      }
  }
  GoToCOurse(){
    if (this.isloggedin== true) {
    this.router.navigate(['course', this.course._id]);
  }
  else 
  {
    this.router.navigate(['login']);
  }
}
showInfo(msg) {
  this.messageService.add({
    severity: 'info',
    summary: 'Success',
    detail: msg,
  });
}

showError(msg) {
  this.messageService.add({
    severity: 'error',
    summary: 'Error',
    detail: msg,
  });
}
}
