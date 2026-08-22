import { Component,ViewChild,OnInit } from '@angular/core';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexTitleSubtitle,ApexPlotOptions
} from "ng-apexcharts";
import {VisDashboardService} from "../../../../../services/vis-dashboard/vis-dashboard.service";
import {ActivatedRoute} from "@angular/router";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis:ApexYAxis;
  plotOptions:ApexPlotOptions
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-most-active-teachers',
  templateUrl: './most-active-teachers.component.html',
  styleUrls: ['./most-active-teachers.component.css']
})
export class MostActiveTeachersComponent implements OnInit{
  @ViewChild("chart", { static: false }) chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  teacherNames: string[]
  numberOfCourses: number[]
  platform:string
  dataPointCount2: number = 5;

  constructor(private route: ActivatedRoute,private visdashboardService: VisDashboardService) {
    this.chartOptions = {
      series: [
        {
          name: "Number of Courses",
          data: [10, 41, 35]
        }
      ],
      chart: {
        height: 280,
        type: "bar"
      },
      plotOptions: {
        bar: {
          horizontal: true,
        }
      },
      title: {
        text: "Most Active Teachers"
      },
      xaxis: {
        categories: ["Jan", "Feb", "Mar"],
        title: {text: "Number of Courses Offered"}
      },
      yaxis: {
        title: {
          text: '-'
        }
      }
    }
  }

  ngOnInit(): void {
    this.platform = this.route.snapshot.paramMap.get('platform');
    this.getActiveTeachers(this.platform.toLowerCase(),5)
    }


    // Await response and update the chart series
  getActiveTeachers(platform:string,dataPointCount:number){
    this.visdashboardService.getActiveTeachersForVis(platform,dataPointCount)
      .then((teachers)=>{
        this.teacherNames = teachers.map((teacher)=> teacher.TeacherName)
        this.numberOfCourses = teachers.map((teacher)=> teacher.NumberOfCourses)
        this.chartOptions.series = [{
          data: this.numberOfCourses,
          name:"Total Courses"
        }];
        this.chartOptions.xaxis ={
          categories: this.teacherNames,
          title: {text: "Number of Courses Offered"}
        };
        this.chartOptions.yaxis ={
          title:{text: "Teachers Names",style: {fontSize:'12px'}},
        }
      })
  }


  onDataChange2(count: number) {
    this.dataPointCount2 = count
    this.getActiveTeachers(this.platform.toLowerCase(), this.dataPointCount2)
  }

}

