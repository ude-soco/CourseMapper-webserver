import { CourseImp } from 'src/app/models/CourseImp';
import { Course } from 'src/app/models/Course';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CourseService } from 'src/app/services/course.service';
import { Router } from '@angular/router';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { State } from 'src/app/state/app.reducer';
import { Store } from '@ngrx/store';
import * as AppActions from 'src/app/state/app.actions'
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
export class SidebarComponent implements OnInit {
  courses: Course[] = [];
  channels: Channel[] = [];
  channel: Channel;
  selectedCourse: Course = new CourseImp('', '');
  displayAddCourseDialogue: boolean = false;

  constructor(
    private courseService: CourseService,
    private router: Router,
    private topicChannelService: TopicChannelService,
    private store: Store<State>
  ) {}

  ngOnInit(): void {
    this.getCourses();
  }

  getCourses() {
    this.courseService
      .fetchCourses()
      .subscribe((courses) => (this.courses = courses));
    this.courseService.onUpdateCourses$.subscribe(
      (courses) => (this.courses = courses)
    );
    //this.setDefaultselection();
  }

  // setDefaultselection(){
  //   if (this.courses.length > 0) {
  //     this.courseService.selectedCourse = this.courses[0];
  //     this.selectedCourse = this.courseService.selectedCourse;
  //   }
  // }

  onAddCourseDialogueClicked() {
    this.toggleAddCoursedialogue(true);
  }

  toggleAddCoursedialogue(visibility) {
    this.displayAddCourseDialogue = visibility;
    console.log(this.displayAddCourseDialogue);
  }

  onSelectCourse(selectedCourse: Course) {
    if (
      this.courseService.getSelectedCourse()._id.toString() !==
      selectedCourse._id.toString()
    ) {
      console.log('rrrr');
      console.log(selectedCourse);
      let course = this.courses.find(
        (course: Course) => course === selectedCourse
      )!;
      this.selectedCourse = course;
      //1
      this.courseService.selectCourse(course);

      if (this.selectedCourse.numberChannels <= 0) {
        console.log('this.selectedCourse.numberTopics');
        console.log(this.selectedCourse.numberChannels);
        this.topicChannelService.selectChannel(this.channel);
        return;
      } else {
        this.channel = this.selectedCourse['channels'][0];

        this.topicChannelService.selectChannel(this.channel);
        console.log(this.channel.name);
      }
    }

    console.log('nnn');
    //console.log(channel);
    this.store.dispatch(AppActions.toggleCourseSelected({courseSelected: true}));
    this.router.navigate(['course', selectedCourse._id]);
  }
}
