import { CourseImp } from 'src/app/models/CourseImp';
import { Course } from 'src/app/models/Course';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CourseService } from 'src/app/services/course.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { State } from 'src/app/state/app.reducer';
import { Store } from '@ngrx/store';
import * as AppActions from 'src/app/state/app.actions'
import { ModeratorPrivilegesService } from 'src/app/services/moderator-privileges.service';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
})
 export  class SidebarComponent implements OnInit {
  courses: Course[] = [];
  channels: Channel[] = [];
  channel: Channel;
  public LandingPage = "/landingPage";
  public HomePage="/home"
  selectedCourse: Course = new CourseImp('', '');
  displayAddCourseDialogue: boolean = false;
  showModeratorPrivileges:boolean

  constructor(
    private courseService: CourseService,
    private router: Router,
    private topicChannelService: TopicChannelService,
    private store: Store<State>,
    private route: ActivatedRoute,
    private moderatorPrivilegesService: ModeratorPrivilegesService,
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
  }

  onAddCourseDialogueClicked() {
    this.toggleAddCoursedialogue(true);
  }

  toggleAddCoursedialogue(visibility) {
    this.displayAddCourseDialogue = visibility;
  }

  onSelectCourse(selectedCourse: Course) {
    if (
      this.courseService.getSelectedCourse()._id.toString() !==
      selectedCourse._id.toString()
    ) {
      let course = this.courses.find(
        (course: Course) => course === selectedCourse
      )!;
      this.selectedCourse = course;
      //1
      this.courseService.selectCourse(course);

      if (this.selectedCourse.numberChannels <= 0) {
        this.topicChannelService.selectChannel(this.channel);
        this.router.navigate(['course', selectedCourse._id]);
        return;
      } else {
        this.channel = this.selectedCourse['channels'][0];
        this.topicChannelService.selectChannel(this.channel);
      }
    }
    this.store.dispatch(AppActions.toggleCourseSelected({courseSelected: true}));
    this.router.navigate(['course', selectedCourse._id]);
  }
}
