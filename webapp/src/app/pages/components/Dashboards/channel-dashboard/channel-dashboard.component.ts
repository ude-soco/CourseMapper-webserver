import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Indicator } from 'src/app/models/Indicator';
import { CourseService } from 'src/app/services/course.service';
import { IndicatorService } from 'src/app/services/indicator.service';

@Component({
  selector: 'app-channel-dashboard',
  templateUrl: './channel-dashboard.component.html',
  styleUrls: ['./channel-dashboard.component.css']
})
export class ChannelDashboardComponent implements OnInit {

  
  indicators: Indicator[] = [];
  courseId: string = "";
  channelId: string = "";

  constructor(public courseService: CourseService,
     private router: Router,
     private indicatorService : IndicatorService){

    const url = this.router.url;
    if (url.includes('course') && url.includes('channel')) {
      const courseRegex = /\/course\/(\w+)/;
      const channelRegex  = /\/channel\/(\w+)/;
      const courseId = courseRegex.exec(url)[1];
      const channelId = channelRegex.exec(url)[1];
      this.courseId = courseId
      this.channelId = channelId

      
    }
    
    

  }
  ngOnInit(): void {
    this.indicatorService.onUpdateIndicators$.subscribe(indicators => {
      this.indicators = indicators;
    })

    this.indicatorService.fetchChannelIndicators(this.courseId, this.channelId).subscribe(
      (indicators) => {
    this.indicators = indicators
      }

      
    )
   
  }


}
