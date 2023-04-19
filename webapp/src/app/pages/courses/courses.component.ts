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
import { getChannelSelected, getCurrentCourse, getCurrentCourseId } from './state/course.reducer';

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
  Users: any;
  userArray: any = new Array();
  channelSelected$: Observable<boolean>;
  courseId:string
  moderator:boolean=false
  constructor(
    private courseService: CourseService,
    private topicChannelService: TopicChannelService,
    private store: Store<State>,
    private userService:UserServiceService, 
    private confirmationService: ConfirmationService,
    private renderer: Renderer2,
    private router: Router,
    private messageService: MessageService,
  
  ) {
    this.courseSelected$ = store.select(getCourseSelected);
    this.channelSelected$ = this.store.select(getChannelSelected);
  }

  ngOnInit(): void {
    
    this.selectedCourse = this.courseService.getSelectedCourse();
     this.ChannelToggel=false 
     this.Users = [];
      this.courseService.onSelectCourse.subscribe((course) => {
        this.selectedCourse = course;
        console.log("this.selectedCourse")
        console.log(this.selectedCourse)

       

        
       
      
       this.ChannelToggel=false  
      this.topicChannelService.fetchTopics(course._id).subscribe( (course) =>{
        this.selectedCourse = course;
        console.log(course,"this.selectedCourse from des page")
        this.Users = course.users;
        console.log(this.Users)
           let userModerator =  this.Users.find(
            (user) => user.role.name === 'moderator'

          );
     
          
          console.log(userModerator,"moderator")
         this.buildCardInfo(userModerator.userId, course);
      }
   )
   if(this.selectedCourse.role==='moderator'){
    this.moderator=true
  }
  else{
    this.moderator=false
  }
      });

  

  }
  buildCardInfo(userModeratorID: string, course: Course) {
    this.userService.GetUserName(userModeratorID).subscribe((user) => {
      this.firstName = user.firstname;
      this.lastName = user.lastname;

      var index = course.createdAt.indexOf('T');
      (this.createdAt = course.createdAt.slice(0, index)),
        course.createdAt.slice(index + 1);
      let ingoPush = {
        id: course._id,
        name: course.name,
        shortName: course.shortName,
        createdAt: this.createdAt,
        firstName: this.firstName,
        lastName: this.lastName,
      };
      this.userArray.push(ingoPush);
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
