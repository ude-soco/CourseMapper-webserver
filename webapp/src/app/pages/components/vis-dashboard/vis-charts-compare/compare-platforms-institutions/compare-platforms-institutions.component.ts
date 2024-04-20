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
  selector: 'app-compare-platforms-institutions',
  templateUrl: './compare-platforms-institutions.component.html',
  styleUrls: ['./compare-platforms-institutions.component.css']
})
export class ComparePlatformsInstitutionsComponent implements OnInit{
  @ViewChild("chart", { static: false }) chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  selectedPlatforms: string[] = [];
  platformNames: string[]
  numberOfInstitution: number[]


  ngOnInit(): void {
    this.loadSelectedPlatformsFromStorage();
    this.getPlatformsByInstitutionCount(this.selectedPlatforms)


    this.platformFilterCompareService.getLanguageFilter().subscribe(platforms=>{
      if(platforms.length === 0 ){
        return
      }
      else{
        this.getPlatformsByInstitutionCount(platforms)
      }
    })
  }


  loadSelectedPlatformsFromStorage(): void {
    const storedPlatforms = localStorage.getItem('selectedPlatforms');
    if (storedPlatforms) {
      this.selectedPlatforms = JSON.parse(storedPlatforms);
    }
  }


  constructor(private visdashboardService: VisDashboardService,private platformFilterCompareService: PlatformFilterCompareService) {
    this.chartOptions = {
      series: [
        {
          name: "Number of Institutions",
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
        text: "Number of Institutions in Platforms"
      },
      xaxis: {
        categories: ["Jan", "Feb", "Mar"],
      },

    }
  }

  getPlatformsByInstitutionCount(platforms:string[]){
    this.visdashboardService.getPlatformsByInstitutionCount(platforms)
      .then((platforms)=>{
        this.platformNames = platforms.map((platform)=> platform.PlatformName)
        this.numberOfInstitution = platforms.map((platform)=> platform.InstitutionCount)
        this.chartOptions.series = [{
          data: this.numberOfInstitution,
          name: 'Total Number of Institutions'
        }]
        this.chartOptions.xaxis={
          categories: this.platformNames
        }
      })
  }



}
