import { Component,ViewChild,OnInit } from '@angular/core';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexTitleSubtitle,ApexPlotOptions
} from "ng-apexcharts";
import {ActivatedRoute} from "@angular/router";
import {VisDashboardService} from "../../../../../services/vis-dashboard/vis-dashboard.service";
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis:ApexYAxis;
  plotOptions:ApexPlotOptions
  title: ApexTitleSubtitle;
};



@Component({
  selector: 'app-most-active-institutions',
  templateUrl: './most-active-institutions.component.html',
  styleUrls: ['./most-active-institutions.component.css']
})
export class MostActiveInstitutionsComponent implements OnInit{
  @ViewChild("chart", { static: false }) chart: ChartComponent;
  public chartOptions: Partial<ChartOptions>;
  institutionNames: string[]
  numberOfCourses: number[]
  platform:string
  dataPointCount2: number = 5

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
        text: "Most Active Institutions"
      },
      xaxis: {
        categories: ["Jan", "Feb", "Mar"],
        title:{
          text: 'undefined'
        }
      },
      yaxis: {
        title: {
          text: 'Sales'
        }
      }

    }
  }

  ngOnInit(): void {
    this.platform = this.route.snapshot.paramMap.get('platform');
    this.getActiveInstitutions(this.platform.toLowerCase(),5)
    }

  getActiveInstitutions(platform:string,dataPointCount:number){
    this.visdashboardService.getActiveInstitutionsForVis(platform,dataPointCount)
      .then((institutions)=>{
        this.institutionNames = institutions.map((institution)=> institution.InstitutionName)
        this.numberOfCourses = institutions.map((institution)=> institution.NumberOfCourses)
        this.chartOptions.series = [{
          data: this.numberOfCourses,
          name:"Total Courses",
        }];
        this.chartOptions.xaxis ={
          categories: this.institutionNames,
          title: {text: "Number of Courses Offered"}
        };
        this.chartOptions.yaxis ={
          title:{text: "Institution Names",style: {fontSize:'12px'}},
        }

      })
  }


  onDataChange2(count: number) {
    this.dataPointCount2 = count
    this.getActiveInstitutions(this.platform.toLowerCase(),this.dataPointCount2)
  }
}
