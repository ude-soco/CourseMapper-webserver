import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';
import { CourseService } from 'src/app/services/course.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import { getCourseSelected, State } from 'src/app/state/app.reducer';
import { getCurrentCourse } from './state/course.reducer';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css'],
})
export class CoursesComponent implements OnInit {
  selectedCourse: Course = new CourseImp('', '');
  courseSelected$: Observable<boolean>;
  course:  Course ;
  createdAt:string
  firstName:string;
  lastName:string;
  ChannelToggel:boolean=false;
  constructor(
    private courseService: CourseService,
    private topicChannelService: TopicChannelService,
    private store: Store<State>,
    private userService:UserServiceService, 
  ) {
    this.courseSelected$ = store.select(getCourseSelected);
    this.ChannelToggel=false
    

  }

  ngOnInit(): void {
    
    this.selectedCourse = this.courseService.getSelectedCourse();
    this.ChannelToggel=false
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
      console.log(this.selectedCourse)
      var index = this.selectedCourse.createdAt.indexOf('T');
      this.createdAt=this.selectedCourse.createdAt.slice(0, index), this.selectedCourse.createdAt.slice(index + 1);
      console.log(this. createdAt)
      console.log(this.selectedCourse.users[0].userId)
      console.log( this.selectedCourse.users[0].userId.role)
   
     //  this.materialService.deleteMaterial(this.selectedMaterial).subscribe({
     //   next: (data) => {
     this.userService.GetUserName(this.selectedCourse.users[0].userId).subscribe({
       next:(user) =>{
         this.firstName=user.firstname
         this.lastName=user.lastname
         console.log( this.firstName)
         console.log( this.lastName)
         
       
           
       }
     }
   
     )
      
     this.ChannelToggel=false

    });


  }
  getName(firstName: string, lastName: string) {
    let Name=firstName+" "+lastName
        return Name.split(" ").slice(0, 2).map((part) => part[0]).join("").toUpperCase();
      }
      NowClicked()
      {
        this.ChannelToggel=true
     
      }
}
