import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Indicator } from 'src/app/models/Indicator';
import { CourseService } from 'src/app/services/course.service';
import { IndicatorService } from 'src/app/services/indicator.service';
import { Location } from '@angular/common';

@Component({
  selector: 'app-material-dashboard',
  templateUrl: './material-dashboard.component.html',
  styleUrls: ['./material-dashboard.component.css']
})
export class MaterialDashboardComponent implements OnInit {
  
  
  indicators: Indicator[] = [];
  courseId: string = "";
  channelId: string = "";
  materialId:  string = "";

  constructor(public courseService: CourseService,
     private router: Router,
     private location: Location,
     private indicatorService : IndicatorService){

    const url = this.router.url;
    if (url.includes('course') && url.includes('channel') && url.includes('materialDashboard')) {
      const courseRegex = /\/course\/(\w+)/;
      const channelRegex  = /\/channel\/(\w+)/;
      const materialRegex =  /\/materialDashboard\/(\w+)/;
      const courseId = courseRegex.exec(url)[1];
      const channelId = channelRegex.exec(url)[1];
      const materialId = materialRegex.exec(url)[1];
      this.courseId = courseId
      this.channelId = channelId
      this.materialId = materialId

      
    }
    
    

  }
  ngOnInit(): void {
    this.indicatorService.onUpdateMaterialIndicators$.subscribe(indicators => {
      this.indicators = indicators;
    })

    this.indicatorService.fetchMaterialIndicators(this.materialId, this.courseId).subscribe(
      (indicators) => {
    this.indicators = indicators
      }

      
    )
   
  }

  onBackBtnClicked(){
   this.location.back();
  }

}
