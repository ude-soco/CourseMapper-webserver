import { Component,OnInit,ViewChild } from '@angular/core';
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
  selector: 'app-compare-platforms-teachers',
  templateUrl: './compare-platforms-teachers.component.html',
  styleUrls: ['./compare-platforms-teachers.component.css']
})
export class ComparePlatformsTeachersComponent implements  OnInit{
  @ViewChild("chart", { static: false }) chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  selectedPlatforms: string[] = [];
  platformNames: string[]
  numberOfTeachers: number[]

  ngOnInit(): void {
    this.loadSelectedPlatformsFromStorage();
    this.getPlatformsByTeacherCount(this.selectedPlatforms)
  }
  loadSelectedPlatformsFromStorage(): void {
    const storedPlatforms = localStorage.getItem('selectedPlatforms');
    if (storedPlatforms) {
      this.selectedPlatforms = JSON.parse(storedPlatforms);
    }
  }

  constructor(private visdashboardService: VisDashboardService) {
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
      },

    }
  }


  getPlatformsByTeacherCount(platforms:string[]){
    this.visdashboardService.getPlatformsByTeacherCount(platforms)
      .then((platforms)=>{
        this.platformNames = platforms.map((platform)=> platform.PlatformName)
        this.numberOfTeachers = platforms.map((platform)=> platform.TeacherCount)
        this.chartOptions.series = [{
          data: this.numberOfTeachers,
          name: 'Total Number of Teachers'
        }]
        this.chartOptions.xaxis={
          categories: this.platformNames
        }
      })
  }

}
