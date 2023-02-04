import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';
import { CourseService } from 'src/app/services/course.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { getCourseSelected, State } from 'src/app/state/app.reducer';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.css'],
})
export class CoursesComponent implements OnInit {
  selectedCourse: Course = new CourseImp('', '');
  courseSelected$: Observable<boolean>;

  constructor(
    private courseService: CourseService,
    private topicChannelService: TopicChannelService,
    private store: Store<State>
  ) {
    this.courseSelected$ = store.select(getCourseSelected);
  }

  ngOnInit(): void {
    this.selectedCourse = this.courseService.getSelectedCourse();
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
    });
  }
}
