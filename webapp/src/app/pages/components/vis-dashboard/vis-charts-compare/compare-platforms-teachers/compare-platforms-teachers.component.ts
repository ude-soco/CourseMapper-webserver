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
import {PlatformFilterCompareService} from "../../../../../services/vis-dashboard/platform-filter-compare.service";
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
  filteredPlatforms: any[] = [];


  ngOnInit(): void {
    this.loadSelectedPlatformsFromStorage();
    this.getPlatformsByTeacherCount(this.selectedPlatforms)
    this.platformFilterCompare.getLanguageFilter().subscribe(platforms=>{
     if(platforms.length === 0 ){
       return
     }
     else{
       this.getPlatformsByTeacherCount(platforms)
     }
    })
  }
  loadSelectedPlatformsFromStorage(): void {
    const storedPlatforms = localStorage.getItem('selectedPlatforms');
    if (storedPlatforms) {
      this.selectedPlatforms = JSON.parse(storedPlatforms);
    }
  }

  constructor(private visdashboardService: VisDashboardService,
              private platformFilterCompare: PlatformFilterCompareService) {
    this.chartOptions = {
      series: [
        {
          name: "Number of Teachers",
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
        text: "Number of Teachers in Platforms"
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
