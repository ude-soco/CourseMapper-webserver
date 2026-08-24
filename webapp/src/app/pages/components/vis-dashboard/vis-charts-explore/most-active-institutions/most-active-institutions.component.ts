/*import { Component,ViewChild,OnInit } from '@angular/core';
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


    // Await the results and update the chart series
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
}*/
import { Component, ViewChild, OnInit, Input } from '@angular/core';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexTitleSubtitle,
  ApexPlotOptions,
  ApexTooltip,
} from 'ng-apexcharts';
import { ActivatedRoute } from '@angular/router';
import { VisDashboardService } from '../../../../../services/vis-dashboard/vis-dashboard.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  plotOptions: ApexPlotOptions;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
};

@Component({
  selector: 'app-most-active-institutions',
  templateUrl: './most-active-institutions.component.html',
  styleUrls: ['./most-active-institutions.component.css'],
})
export class MostActiveInstitutionsComponent implements OnInit {
  @ViewChild('chart', { static: false }) chart?: ChartComponent;
  @Input() platform?: string;

  chartOptions: Partial<ChartOptions>;
  institutionNames: string[] = [];
  numberOfCourses: number[] = [];
  dataPointCount2 = 5;

  // panel
  selectedInstitution: { id?: number; name: string } | null = null;
  courses: any[] = [];
  loading = false;
  pageSize = 10;

  private readonly tooltipHtml: ApexTooltip = {
    enabled: true,
    shared: false,
    intersect: true,
    custom: ({ w, dataPointIndex }: { w: any; dataPointIndex: number }) => {
      const name = w?.globals?.labels?.[dataPointIndex] ?? '';
      return `
        <div style="background:#fff;border:1px solid #e5e7eb;border-radius:6px;
                    padding:8px 10px;box-shadow:0 4px 10px rgba(0,0,0,.06);
                    font-family:inherit;font-size:12px;color:#111827">
          <div style="font-weight:600;margin-bottom:4px">${name}</div>
          <div>Click to see more detailed list of courses</div>
        </div>`;
    },
  };

  constructor(
    private route: ActivatedRoute,
    private visdashboardService: VisDashboardService
  ) {
    this.chartOptions = {
      series: [{ name: 'Number of Courses', data: [] }],
      chart: {
        height: 280,
        type: 'bar',
        events: {
          dataPointSelection: (_e, _ctx, cfg) => {
            const i = cfg?.dataPointIndex;
            if (i == null || i < 0) return;
            const name = cfg?.w?.globals?.labels?.[i] ?? this.institutionNames[i];
            if (name) this.onInstitutionBarClick({ name });
          },
        },
      },
      plotOptions: { bar: { horizontal: true } },
      title: { text: 'Most Active Institutions' },
      xaxis: { categories: [], title: { text: 'Number of Courses Offered' } },
      yaxis: { title: { text: 'Institution Names', style: { fontSize: '12px' } } },
      tooltip: this.tooltipHtml,
    };
  }

  ngOnInit(): void {
    if (!this.platform) this.platform = this.route.snapshot.paramMap.get('platform') ?? '';
    this.platform = this.platform.trim().replace(/\s+/g, ' ');
    this.getActiveInstitutions(this.platform.toLowerCase(), this.dataPointCount2);
  }

  getActiveInstitutions(platform: string, dataPointCount: number) {
    this.visdashboardService
      .getActiveInstitutionsForVis(platform, dataPointCount)
      .then(rows => {
        this.institutionNames = rows.map((r: any) => r.InstitutionName);
        this.numberOfCourses = rows.map((r: any) => r.NumberOfCourses);
        if (this.chart) {
          this.chart.updateOptions(
            {
              xaxis: { categories: this.institutionNames, title: { text: 'Number of Courses Offered' } },
              yaxis: { title: { text: 'Institution Names', style: { fontSize: '12px' } } },
              tooltip: this.tooltipHtml,
            },
            true,
            true
          );
          this.chart.updateSeries([{ name: 'Total Courses', data: this.numberOfCourses }], true);
        } else {
          this.chartOptions.xaxis = { categories: this.institutionNames, title: { text: 'Number of Courses Offered' } };
          this.chartOptions.yaxis = { title: { text: 'Institution Names', style: { fontSize: '12px' } } };
          this.chartOptions.series = [{ name: 'Total Courses', data: this.numberOfCourses }];
        }
      })
      .catch(() => {
        if (this.chart) this.chart.updateSeries([{ name: 'Total Courses', data: [] }], true);
        else this.chartOptions.series = [{ name: 'Total Courses', data: [] }];
      });
  }

  onDataChange2(n: number) {
    this.dataPointCount2 = n;
    this.getActiveInstitutions(this.platform!.toLowerCase(), n);
  }

  private fetchInstitutionCourses(i: { id?: number; name: string }) {
    return i.id != null
      ? this.visdashboardService.getInstitutionCoursesForVisById(this.platform!, i.id)
      : this.visdashboardService.getInstitutionCoursesForVisByName(this.platform!, i.name);
  }

  async onInstitutionBarClick(i: { id?: number; name: string }) {
    this.selectedInstitution = i;
    this.loading = true;
    try {
      this.courses = (await this.fetchInstitutionCourses(i)) ?? [];
    } finally {
      this.loading = false;
    }
  }

  onPanelBack() {
    this.selectedInstitution = null;
    this.courses = [];
  }
}
