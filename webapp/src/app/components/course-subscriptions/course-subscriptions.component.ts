import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Subscription } from 'src/app/model/subscription';
import { CourseService } from 'src/app/services/course.service';

@Component({
  selector: 'app-course-subscriptions',
  templateUrl: './course-subscriptions.component.html',
  styleUrls: ['./course-subscriptions.component.css'],
})
export class CourseSubscriptionsComponent implements OnInit {
  subscriptions: Subscription[];
  @Output() closeSubscription = new EventEmitter();
  constructor(private courseService: CourseService) {}

  ngOnInit(): void {
    this.courseService.getSubscribedCourseLists().subscribe((res: any) => {
      this.subscriptions = res.courseDetail;
    });

    this.courseService.subscribedCourseLists$.subscribe((lists) => {
      this.subscriptions = lists.courseDetail;
    });
  }

  unSubscribe(courseId: string) {
    this.courseService.withdrawCourse(courseId).subscribe((res: any) => {
      this.courseService.getSubscribedCourseLists().subscribe();
    });
  }

  closeMySubscription() {
    this.closeSubscription.emit();
  }
}
