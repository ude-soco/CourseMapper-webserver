import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {  Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/Course';
import { CourseService } from 'src/app/services/course.service';
import { StorageService } from 'src/app/services/storage.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import { getCurrentCourse, getCurrentCourseId, State } from '../../courses/state/course.reducer';

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

  constructor(private storageService: StorageService, 
    private store: Store<State>, 
    private userService:UserServiceService, 
    private courseService: CourseService,
    private router: Router
    )
  {
    
    this.store.select(getCurrentCourse).subscribe((course) => 
    this.course=course);
    console.log(this.course, "this.course course des page")
  //   var index = this.course.createdAt.indexOf('T');
  //  this.createdAt=this.course.createdAt.slice(0, index), this.course.createdAt.slice(index + 1);
  this.createdAt=this.course.createdAt
  this.firstName=this.course.firstName
  this.lastName=this.course.lastName
   console.log(this. createdAt)
   console.log(this. course.id)


  //  this.materialService.deleteMaterial(this.selectedMaterial).subscribe({
  //   next: (data) => {
  // this.userService.GetUserName(this.course.users[0].userId).subscribe({
  //   next:(user) =>{
  //     this.firstName=user.firstname
  //     this.lastName=user.lastname
  //     console.log( this.firstName)
  //     console.log( this.lastName)
        
  //   }
  // }

  // )
   this.courseService.fetchCourses().subscribe( (courses) => {console.log("course desc course Rawaa", courses)  
   let varcc=courses.find(course=> this.course.id === course._id  )
    //{
   //if(this.course._id === course._id )
   {
     // console.log(course._id)
     // this.Enrolled=true;
    // console.log(this.Enrolled)
     // return this.Enrolled;
    // return course;
   //}
   // else{
  //   // console.log(this.Enrolled)
  //   // console.log(course._id)
  //   // this.Enrolled=false;
   //   // return this.Enrolled;
  //   return course;
  // }
  

 }

 console.log(varcc)
 if(varcc){
   this.Enrolled= true
 }else{
   this.Enrolled= false

 }
 console.log(this.Enrolled)
 })
  
//     this.store.select(getCurrentCourseId).subscribe((id) => console.log(id));
  }
  ngOnInit(): void {
    this.isloggedin = this.storageService.isLoggedIn();
    console.log("this.username course description")
    console.log(this.isloggedin)
//       this.store.select(getCurrentCourse).subscribe((data) => {
//   console.log("channel name observable called")
//   this.Course=data
//   console.log(this.Course)
// })


  }
  getName(firstName: string, lastName: string) {
let Name=firstName+" "+lastName
    return Name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }
  EnrollToCOurse(){
    if (this.isloggedin== false){
      this.router.navigate(['login']);
    }
    else if (this.isloggedin== true) {
    this.courseService.EnrollToCOurse(this.course.id).subscribe(
       (data) => {
        this.Enrolled= true
        console.log("response of enrollment", data)
        this.router.navigate(['course', this.course.id]);
         
       })
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
}
