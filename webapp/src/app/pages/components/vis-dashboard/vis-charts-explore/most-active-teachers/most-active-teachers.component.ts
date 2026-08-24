/*import { Component,ViewChild,OnInit } from '@angular/core';
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
import { VisDashboardService } from '../../../../../services/vis-dashboard/vis-dashboard.service';
import { ActivatedRoute } from '@angular/router';

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
  selector: 'app-most-active-teachers',
  templateUrl: './most-active-teachers.component.html',
  styleUrls: ['./most-active-teachers.component.css'],
})
export class MostActiveTeachersComponent implements OnInit {
  @ViewChild('chart', { static: false }) chart?: ChartComponent;
  @Input() platform?: string;

  chartOptions: Partial<ChartOptions>;
  teacherNames: string[] = [];
  numberOfCourses: number[] = [];
  dataPointCount2 = 5;

  // panel state (fed to <app-courses-panel>)
  selectedTeacher: { id?: number; name: string } | null = null;
  courses: any[] = [];
  loading = false;
  pageSize = 10;

  private readonly tooltipHtml: ApexTooltip = {
    enabled: true,
    shared: false,
    intersect: true,
    // matches the “old” style/content from your 2nd screenshot
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
            const name = cfg?.w?.globals?.labels?.[i] ?? this.teacherNames[i];
            if (name) this.onTeacherBarClick({ name });
          },
        },
      },
      plotOptions: { bar: { horizontal: true } },
      title: { text: 'Most Active Teachers' },
      xaxis: { categories: [], title: { text: 'Number of Courses Offered' } },
      yaxis: { title: { text: 'Teachers Names', style: { fontSize: '12px' } } },
      tooltip: this.tooltipHtml,
    };
  }

  ngOnInit(): void {
    if (!this.platform) this.platform = this.route.snapshot.paramMap.get('platform') ?? '';
     this.platform = this.platform.trim().replace(/\s+/g, ' ');
    this.getActiveTeachers(this.platform.toLowerCase(), this.dataPointCount2);
  }

  getActiveTeachers(platform: string, dataPointCount: number) {
    this.visdashboardService
      .getActiveTeachersForVis(platform, dataPointCount)
      .then(rows => {
        this.teacherNames = rows.map((r: any) => r.TeacherName);
        this.numberOfCourses = rows.map((r: any) => r.NumberOfCourses);
        if (this.chart) {
          this.chart.updateOptions(
            {
              xaxis: { categories: this.teacherNames, title: { text: 'Number of Courses Offered' } },
              yaxis: { title: { text: 'Teachers Names', style: { fontSize: '12px' } } },
              tooltip: this.tooltipHtml,
            },
            true,
            true
          );
          this.chart.updateSeries([{ name: 'Total Courses', data: this.numberOfCourses }], true);
        } else {
          this.chartOptions.xaxis = { categories: this.teacherNames, title: { text: 'Number of Courses Offered' } };
          this.chartOptions.yaxis = { title: { text: 'Teachers Names', style: { fontSize: '12px' } } };
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
    this.getActiveTeachers(this.platform!.toLowerCase(), n);
  }

  // panel actions
  private fetchTeacherCourses(t: { id?: number; name: string }) {
    return t.id != null
      ? this.visdashboardService.getTeacherCoursesForVisById(this.platform!, t.id)
      : this.visdashboardService.getTeacherCoursesForVisByName(this.platform!, t.name);
  }

  async onTeacherBarClick(t: { id?: number; name: string }) {
    this.selectedTeacher = t;
    this.loading = true;
    try {
      this.courses = (await this.fetchTeacherCourses(t)) ?? [];
    } finally {
      this.loading = false;
    }
  }

  onPanelBack() {
    this.selectedTeacher = null;
    this.courses = [];
  }
}
