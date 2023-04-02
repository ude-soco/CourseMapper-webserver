import { Component } from '@angular/core';
import {  Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/Course';
import { StorageService } from 'src/app/services/storage.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import { getCurrentCourse, getCurrentCourseID, State } from '../../courses/state/course.reducer';

@Component({
  selector: 'app-course-description',
  templateUrl: './course-description.component.html',
  styleUrls: ['./course-description.component.css']
})
export class CourseDescriptionComponent {
  course:  Course ;
  CourseId:  Observable<string> ;
  isloggedin: boolean = false;
  createdAt:string
  firstName:string;
  lastName:string

  constructor(private storageService: StorageService, private store: Store<State>, private userService:UserServiceService)
  {
    
    this.store.select(getCurrentCourse).subscribe((course) => 
    this.course=course);
    var index = this.course.createdAt.indexOf('T');
   this.createdAt=this.course.createdAt.slice(0, index), this.course.createdAt.slice(index + 1);
   console.log(this. createdAt)
   console.log(this.course.users[0].userId)
  //  this.materialService.deleteMaterial(this.selectedMaterial).subscribe({
  //   next: (data) => {
  this.userService.GetUserName(this.course.users[0].userId).subscribe({
    next:(user) =>{
      this.firstName=user.firstname
      this.lastName=user.lastname
      console.log( this.firstName)
      console.log( this.lastName)
    }
  }

  )
    this.store.select(getCurrentCourseID).subscribe((id) => console.log(id));
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
}
