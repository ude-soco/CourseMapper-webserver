import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Indicator } from 'src/app/models/Indicator';
import { CourseService } from 'src/app/services/course.service';
import { IndicatorService } from 'src/app/services/indicator.service';

@Component({
  selector: 'app-course-dashboard',
  templateUrl: './course-dashboard.component.html',
  styleUrls: ['./course-dashboard.component.css'],
})
export class CourseDashboardComponent implements OnInit, OnDestroy {
  indicators: Indicator[] = [];
  courseId: string = '';
  subscription: any;

  constructor(
    public courseService: CourseService,
    private router: Router,
    private indicatorService: IndicatorService
  ) {
    const url = this.router.url;
    if (url.includes('course')) {
      const courseRegex = /\/course\/(\w+)/;
      const courseId = courseRegex.exec(url)[1];
      this.courseId = courseId;
    }
  }
  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
  ngOnInit(): void {
    this.subscription = this.indicatorService.onUpdateIndicators$.subscribe(
      (indicators) => {
        this.indicators = indicators;
      }
    );

    this.indicatorService
      .fetchIndicators(this.courseId)
      .subscribe((indicators) => {
        this.indicators = indicators;
      });
  }
}
