import { Component, Input, OnInit, Renderer2 } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { ConfirmationService, MessageService } from 'primeng/api';

import { Observable } from 'rxjs';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';
import { CourseService } from 'src/app/services/course.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { UserServiceService } from 'src/app/services/user-service.service';
import { getCourseSelected, State } from 'src/app/state/app.reducer';
import { getChannelSelected, getCurrentCourse } from './state/course.reducer';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class CoursesComponent implements OnInit {
  selectedCourse: Course = new CourseImp('', '');
  courseSelected$: Observable<boolean>;
  course:  Course ;
  createdAt:string
  firstName:string;
  lastName:string;
  ChannelToggel:boolean=false;
  channelSelected$: Observable<boolean>;
  constructor(
    private courseService: CourseService,
    private topicChannelService: TopicChannelService,
    private store: Store<State>,
    private userService:UserServiceService, 
    private confirmationService: ConfirmationService,
    private renderer: Renderer2,
    private router: Router,
    private messageService: MessageService
  ) {
    this.courseSelected$ = store.select(getCourseSelected);
    this.channelSelected$ = this.store.select(getChannelSelected);
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
 deEnrole()
      {
       
          this.confirmationService.confirm({
            message:
              'Are you sure you want to Un Enroll from course"' + this.selectedCourse.name + '"?',
            header: 'Un-Enroll Confirmation',
            icon: 'pi pi-info-circle',
            accept: (e) => this.unEnrolleCourse(this.selectedCourse),
           
            reject: () => {
              // this.informUser('info', 'Cancelled', 'Deletion cancelled')
            },
          });

        
      }
unEnrolleCourse(course : Course){
       console.log('un enole triggred')
console.log(course)
this.courseService.WithdrawFromCourse(course).subscribe(
  (res) => {
   if ('success' in res)
   {
    this.showInfo('You have been  withdrewed successfully ');
    console.log("response of enrollment", res)
    this.router.navigate(['course-description', course._id]);
   }
   (er) => {
    console.log(er);
    alert(er.error.error);
    this.showError('Please make sure to add a valid data!');
  }
    
  })
      }

      showInfo(msg) {
        this.messageService.add({
          severity: 'info',
          summary: 'Success',
          detail: msg,
        });
      }
      /**
       * @function showError
       * shows the user if his action failed
       *
       */
      showError(msg) {
        this.messageService.add({
          severity: 'error',
          summary: 'Error',
          detail: msg,
        });
      }
}
