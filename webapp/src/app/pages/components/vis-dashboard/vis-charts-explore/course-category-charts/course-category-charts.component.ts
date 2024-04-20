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
import {processCourses} from "../../../../../utils/useProcessCourseRatingsPrices";

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis:ApexYAxis;
  plotOptions:ApexPlotOptions
  title: ApexTitleSubtitle;
};

export type ChartOptions3 = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis:ApexYAxis;
  plotOptions:ApexPlotOptions
  title: ApexTitleSubtitle;
};

export type ChartOptionsCategory = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis:ApexYAxis;
  plotOptions:ApexPlotOptions
  title: ApexTitleSubtitle;
};

@Component({
  selector: 'app-course-category-charts',
  templateUrl: './course-category-charts.component.html',
  styleUrls: ['./course-category-charts.component.css']
})
export class CourseCategoryChartsComponent implements OnInit{
  @ViewChild("chart", { static: false }) chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  public chartOptions2: Partial<ChartOptionsCategory>;
  public chartOptions3: Partial<ChartOptions3>;

  numberOfParticipants: number[]
  courseName: string[]
  platform: string
  totalParticipants: number[]
  courseCategories: string[]
  dataPointCount: number = 5;
  dataPointCount2: number = 5;
  dataPointCount3: number = 5;





  constructor(private route: ActivatedRoute,private visdashboardService: VisDashboardService) {
    this.chartOptions = {
     series: [
        {
          name: "Number of Participants",
          data: [10, 41, 35]
        }
      ],
      chart: {
        height: 280,
        type: "bar"
      },
      plotOptions:{
        bar:{
          horizontal:true,
        }
      },
     title: {
        text: "Most Popular Courses"
      },
      xaxis: {
        categories: ["Jan", "Feb",  "Mar"],
      },

    }

    this.chartOptions2 = {
      series: [
        {
          name: "Number of Participants",
          data: [10, 41, 35]
        }
      ],
      chart: {
        height: 280,
        type: "bar"
      },
      plotOptions:{
        bar:{
          horizontal:true,
        }
      },
      title: {
        text: "Most Popular Categories of courses"
      },
      xaxis: {
        categories: ["Jan", "Feb",  "Mar"],
      },

    }

    this.chartOptions3 = {
      series: [{
        name: "SAMPLE A",
        data: [
          [16.4, 5.4],  [21.7, 2], [25.4, 3]]
      },],
      chart: {
        height: 280,
        type: 'scatter',
        zoom: {
          enabled: true,
          type: 'xy'
        }
      },
      xaxis: {
        tickAmount: 10,
        labels: {
          formatter: function(val) {
            return parseFloat(val).toFixed(1)
          }
        }
      },
      yaxis: {
        tickAmount: 7
      }
    }


  }

  ngOnInit(): void {
    this.platform = this.route.snapshot.paramMap.get('platform');
    this.getPopularCourses(this.platform.toLowerCase(),5)
    this.getPopularCategories(this.platform.toLowerCase(), 5)
    this.getCoursesRatingsPrices(this.platform.toLowerCase(), 5)
  }

getPopularCourses(platform:string, dataPointCounts: number){
    this.visdashboardService.getCoursesByPopularityForVis(platform,dataPointCounts)
      .then((courses)=>{
        this.numberOfParticipants = courses.map(course=> +course.NumberOfParticipants)
        this.courseName = courses.map(course=> course.CourseName.slice(0,20))
        this.chartOptions.series = [{
          data: this.numberOfParticipants,
          name:"Number of Participants"
        }];
        this.chartOptions.xaxis ={
          categories: this.courseName
        }
      })
}

  getPopularCategories(platform:string, dataPointCounts: number){
    this.visdashboardService.getCategoryByPopularityForVis(platform,dataPointCounts)
      .then((courses)=>{
        this.totalParticipants = courses.map(categories=> +categories.TotalParticipants)
        this.courseCategories = courses.map(categories=> categories.CourseCategory.slice(0,20))
        this.chartOptions2.series = [{
          data: this.totalParticipants,
          name:"Total Participants"
        }];
        this.chartOptions2.xaxis ={
          categories: this.courseCategories
        }
      })
  }

  getCoursesRatingsPrices(platform:string, dataPointCounts: number){
    this.visdashboardService.getCoursesRatingsPricesForVis(platform, dataPointCounts)
      .then((courses)=>{
      const j = processCourses(courses)
        this.chartOptions3.series = [{
        data: j,
          name: 'me'
        }]
      })
  }


  onDataChange(count: number) {
    this.dataPointCount = count
    this.getPopularCourses(this.platform.toLowerCase(),this.dataPointCount)
  }

  onDataChange2(count: number) {
    this.dataPointCount2 = count
    this.getPopularCategories(this.platform.toLowerCase(),this.dataPointCount2)
  }


  onDataChange3(count: number) {
    this.dataPointCount3 = count
    this.getCoursesRatingsPrices(this.platform.toLowerCase(),this.dataPointCount3)

  }
}
