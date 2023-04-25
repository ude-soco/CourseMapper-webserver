import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { StorageService } from 'src/app/services/storage.service';
import { State } from 'src/app/state/app.reducer';
import * as AppActions from 'src/app/state/app.actions';
import * as MaterialActions from 'src/app/pages/components/materials/state/materials.actions';
import { CourseService } from 'src/app/services/course.service';
import { Course } from 'src/app/models/Course';
import * as CourseAction from 'src/app/pages/courses/state/course.actions'
import * as  CourseActions from 'src/app/pages/courses/state/course.actions'
import { UserServiceService } from 'src/app/services/user-service.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  currentUser: {} | undefined;
  isloggedin: boolean = false;
  username?: string;
  courses:Course [] =[]
  Allcourses:Course [] =[]
  Users: any;
  userArray: any = new Array();
  createdAt: string;

  firstName: string = '';
  lastName: string = '';
  constructor(
    private storageService: StorageService,
    private router: Router,
    private store: Store<State>,
    private courseService: CourseService,
    private userService: UserServiceService,
  ) {
    this.courseService.GetAllCourses().subscribe(
      {
        next: async (courses) => {
          this.Allcourses = courses;
          console.log("this.Allcourses",this.Allcourses)
         
        }
      }
    )
  }

  ngOnInit(): void {
    this.currentUser = this.storageService.getUser();
    this.isloggedin = this.storageService.isLoggedIn();

    this.store.dispatch(
      AppActions.toggleCourseSelected({ courseSelected: false })
      
    );
    this.store.dispatch(CourseActions.setCurrentCourse({selcetedCourse: null}));
    this.store.dispatch(
      CourseActions.toggleChannelSelected({ channelSelected: false })
    );

    if (this.isloggedin == false) {
      this.router.navigate(['login']);
    } else {
      const user = this.storageService.getUser();

      this.username = user.username;
    }

    this.courseService.fetchCourses().subscribe( (courses) => {console.log("course desc course Rawaa",this.courses=courses)  
    console.log(this.courses)
   
    for (var course of this.courses) {
      this.Users = [];

      this.Users = course.users;
// console.log(course.users[0].role.name)
//       let userModerator = this.Users.find(
//         (user) => user.role.id === 'moderator'
//       );

      this.buildCardInfo(course.users[0].userId, course);
    }


     })
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
        description:course.description
      };
      this.userArray.push(ingoPush);
      console.log(this.userArray)
    });
  }
  onSelectCourse(selcetedCourse:any)
  {
        
    this.router.navigate(['course', selcetedCourse.id]);
    this.store.dispatch(CourseAction.setCurrentCourse({selcetedCourse: selcetedCourse}));
    this.store.dispatch(CourseActions.setCourseId({ courseId: selcetedCourse.id}));
    console.log("course Home page")
    console.log(selcetedCourse)
  }
}
