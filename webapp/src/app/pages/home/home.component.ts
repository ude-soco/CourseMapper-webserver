import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { StorageService } from 'src/app/services/storage.service';
import { State } from 'src/app/state/app.reducer';
import * as AppActions from 'src/app/state/app.actions';
import * as MaterialActions from 'src/app/pages/components/materils/state/materials.actions';
import { CourseService } from 'src/app/services/course.service';
import { Course } from 'src/app/models/Course';
import * as CourseAction from 'src/app/pages/courses/state/course.actions'

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

  constructor(
    private storageService: StorageService,
    private router: Router,
    private store: Store<State>,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.currentUser = this.storageService.getUser();
    this.isloggedin = this.storageService.isLoggedIn();

    this.store.dispatch(
      AppActions.toggleCourseSelected({ courseSelected: false })
    );
    this.store.dispatch(
      MaterialActions.toggleChannelSelected({ channelSelected: false })
    );

    if (this.isloggedin == false) {
      this.router.navigate(['login']);
    } else {
      const user = this.storageService.getUser();

      this.username = user.username;
    }
    this.courseService.fetchCourses().subscribe( (course) => {console.log("course desc course Rawaa",this.courses=course)  
    console.log(this.courses.length)
     })
  }
  onSelectCourse(selcetedCourse:Course)
  {
    this.store.dispatch(CourseAction.setCurrentCourse({selcetedCourse}));
    this.store.dispatch(CourseAction.setCurrentCourseID({selcetedCourseID:selcetedCourse._id }));
    this.router.navigate(['course-description', selcetedCourse._id]);
    console.log("course Home page")
    console.log(selcetedCourse)
  }
}
