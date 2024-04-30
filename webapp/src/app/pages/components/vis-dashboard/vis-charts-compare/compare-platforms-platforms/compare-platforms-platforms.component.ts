import { Component,OnInit, ViewChild } from '@angular/core';
import {
  ChartComponent,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexTitleSubtitle,ApexPlotOptions
} from "ng-apexcharts";
import {VisDashboardService} from "../../../../../services/vis-dashboard/vis-dashboard.service";
import {PlatformFilterCompareService} from "../../../../../services/vis-dashboard/platform-filter-compare.service";
import {
  VisSelectedPlatformsCompareService
} from "../../../../../services/vis-dashboard/vis-selected-platforms-compare.service";
import {useSelectedPlatforms} from "../../../../../utils/useSelectedPlatforms";

export type ChartOptions = {
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis:ApexYAxis;
  plotOptions:ApexPlotOptions
  title: ApexTitleSubtitle;
};


@Component({
  selector: 'app-compare-platforms-platforms',
  templateUrl: './compare-platforms-platforms.component.html',
  styleUrls: ['./compare-platforms-platforms.component.css']
})
export class ComparePlatformsPlatformsComponent implements OnInit {
  @ViewChild("chart", {static: false}) chart: ChartComponent;
  chartOptions: any;
  selectedPlatforms: string[] = [];
  selectedPlatformsFromStorage: string[] = [];

  series: number[];
  labels: string[];

  ngOnInit(): void {
    this.loadSelectedPlatformsFromStorage();
    this.loadSelectedPlatforms()
    this.getNumberOfParticipantsForCompare(useSelectedPlatforms(this.selectedPlatforms,this.selectedPlatformsFromStorage))

    this.platformFilterCompare.getLanguageFilter().subscribe(platforms=>{
      if(platforms.length === 0 ){
        return
      }
      else{
        this.getNumberOfParticipantsForCompare(platforms)
      }
    })
  }

  loadSelectedPlatformsFromStorage(): void {
    const storedPlatforms = localStorage.getItem('selectedPlatforms');
    if (storedPlatforms) {
      this.selectedPlatformsFromStorage= JSON.parse(storedPlatforms);
    }
  }


  constructor(private readonly visDashboardServices:VisDashboardService,
              private platformFilterCompare: PlatformFilterCompareService,
              private readonly visSelectedPlatformsCompare: VisSelectedPlatformsCompareService
              ) {


    this.chartOptions = {
      chart: {
        type: 'pie',
        height: 280,
      },
      title:{
        text: "Total Number of Participants"
      },
      labels: ['Apple', 'Mango', 'Orange', 'Watermelon'],
      series: [44, 55, 13, 33,34],
    };
  }

  loadSelectedPlatforms(): void {
    this.visSelectedPlatformsCompare.getSelectedPlatforms().subscribe(platforms=>{
      this.selectedPlatforms = platforms
    })
  }

getNumberOfParticipantsForCompare(platforms:string[]){
    this.visDashboardServices.getPlatformsByParticipants(platforms)
      .then((platforms)=>{
        this.chartOptions.series = platforms.map(platform=> platform.TotalParticipants)
        this.chartOptions.labels = platforms.map(platform => platform.PlatformName)
      })
}


}
