import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Indicator } from 'src/app/models/Indicator';
import { CourseService } from 'src/app/services/course.service';
import { IndicatorService } from 'src/app/services/indicator.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';

@Component({
  selector: 'app-topic-dashboard',
  templateUrl: './topic-dashboard.component.html',
  styleUrls: ['./topic-dashboard.component.css']
})
export class TopicDashboardComponent implements OnInit {
  indicators: Indicator[] = [];
  topicId: string = "";
  courseId: string = "";

  constructor(public courseService: CourseService,
     private router: Router,
     private indicatorService : IndicatorService){

    const url = this.router.url;
    if (url.includes('course') && url.includes('topic')) {
      const courseRegex = /\/course\/(\w+)/;
      const topicRegex = /\/topic\/(\w+)/;
      const courseId = courseRegex.exec(url)[1];
      const topicId = topicRegex.exec(url)[1];
      this.topicId = topicId;
      this.courseId = courseId

      
    }
    
    

  }
  ngOnInit(): void {
    this.indicatorService.onUpdateIndicators$.subscribe(indicators => {
      this.indicators = indicators;
    })

    this.indicatorService.fetchTopicIndicators(this.courseId, this.topicId).subscribe(
      (indicators) => {
    this.indicators = indicators
      }

      
    )
   
  }

}
