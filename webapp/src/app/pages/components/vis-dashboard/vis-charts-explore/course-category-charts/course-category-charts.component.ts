import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import {
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexPlotOptions,
  ApexTitleSubtitle,
  ApexTooltip,
  ApexMarkers
} from 'ng-apexcharts';
import { ActivatedRoute, Router } from '@angular/router';
import {
  VisDashboardService,
  CoursesRatingsPricesForVis
} from '../../../../../services/vis-dashboard/vis-dashboard.service';

/* ----- Types for our charts ----- */
export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  plotOptions?: ApexPlotOptions;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  markers?: ApexMarkers;
};
export type ChartOptionsCategory = ChartOptions;

export type ChartOptions3 = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  markers: ApexMarkers;
};

type CourseListRow = {
  Id: number;
  CourseId: string;
  CourseName: string;
  Rating: number;
  NumberOfParticipants: number;
  Language?: string;
  Level?: string;
  Platform?: string;
};

@Component({
  selector: 'app-course-category-charts',
  templateUrl: './course-category-charts.component.html',
  styleUrls: ['./course-category-charts.component.css']
})
export class CourseCategoryChartsComponent implements OnInit {
  @ViewChild('coursesChart') coursesChart?: ChartComponent;
  @ViewChild('catsChart')    catsChart?: ChartComponent;
  @ViewChild('scatterChart') scatterChart?: ChartComponent;

  public chartOptions:  Partial<ChartOptions> = {};
  public chartOptions2: Partial<ChartOptionsCategory> = {};
  public chartOptions3: Partial<ChartOptions3> = {};

  numberOfParticipants: number[] = [];
  courseName: string[] = [];
  courseIds: string[] = [];
  totalParticipants: number[] = [];
  courseCategories: string[] = [];

  dataPointCount  = 5;
  dataPointCount2 = 5;
  dataPointCount3 = 10;

  platform = '';
  hasPriceAndRatings = true;
  hasCategoriesEnrolledStudents = true;
  hasCoursesEnrolledStudents = true;

  // toggles to force redraws
  coursesChartVisible = true;
  catsChartVisible    = true;
  scatterChartVisible = true;

  // Category → courses table
  selectedCategory: string | null = null;
  loadingCategory = false;
  coursesForCategory: CourseListRow[] = [];

  // keep raw scatter points so click handler can access id/name
  private scatterPoints: Array<{ x: number; y: number; name: string; id?: string }> = [];

  constructor(
    private route: ActivatedRoute,
    private svc: VisDashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    const fmt = (n: number) =>
      n >= 1_000_000 ? (n / 1_000_000).toFixed(1) + 'M'
      : n >= 1_000   ? (n / 1_000).toFixed(1)   + 'K'
      : String(n);

    /* -------- Popular Courses (bar) -------- */
    this.chartOptions = {
      series: [{ name: 'Number of Participants', data: [] }],
      chart: {
        height: 280,
        type: 'bar',
        events: {
          dataPointSelection: (_ev, _ctx, cfg) => {
            const s = cfg?.seriesIndex;
            const d = cfg?.dataPointIndex;
            const datum: any = cfg?.w?.config?.series?.[s]?.data?.[d];
            const id = datum?.id;
            if (id) window.open(`/course-detail/${id}`, '_blank');
          }
        }
      },
      plotOptions: { bar: { horizontal: true } },
      title: { text: 'Most Popular Courses' },
      xaxis: { categories: [], title: { text: 'Number of Enrolled Students' } },
      yaxis: { title: { text: 'Course Name', style: { fontSize: '12px' } } },
      tooltip: {
        enabled: true,
        shared: false,
        intersect: true,
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          const datum: any = w?.config?.series?.[seriesIndex]?.data?.[dataPointIndex] ?? {};
          const label = (datum.x ?? w?.config?.xaxis?.categories?.[dataPointIndex] ?? '').toString();
          const value = Number(datum.y ?? 0);
          return `
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,.08);padding:10px 12px;min-width:220px;font:12px/1.4 system-ui;color:#111827">
              <div style="font-weight:600;margin-bottom:6px">${label}</div>
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:#3b82f6"></span>
                <span>Number of Participants:&nbsp;<strong>${fmt(value)}</strong></span>
              </div>
              <div style="margin-top:6px;color:#6b7280;">Click to see the course details</div>
            </div>`;
        }
      }
    };

    /* -------- Popular Categories (bar) -------- */
    this.chartOptions2 = {
      series: [{ name: 'Total Participants', data: [] }],
      chart: {
        height: 280,
        type: 'bar',
        events: {
          dataPointSelection: (_ev, _ctx, cfg) => {
            const cat = cfg?.w?.config?.xaxis?.categories?.[cfg?.dataPointIndex] as string;
            if (cat) this.onCategoryClick(cat);
          }
        }
      },
      plotOptions: { bar: { horizontal: true } },
      title: { text: 'Most Popular Categories of courses' },
      xaxis: { categories: [], title: { text: 'Number of Enrolled Students' } },
      yaxis: { title: { text: 'Course Category', style: { fontSize: '12px' } } },
      tooltip: {
        enabled: true,
        custom: ({ dataPointIndex, w }) => {
          const label = w?.config?.xaxis?.categories?.[dataPointIndex] ?? '';
          return `
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,.08);padding:10px 12px;min-width:220px;font:12px/1.4 system-ui;color:#111827">
              <div style="font-weight:600;margin-bottom:6px">${label}</div>
              <div style="color:#6b7280;">Click to see related courses</div>
            </div>`;
        }
      }
    };

    /* -------- Ratings vs Price (scatter) -------- */
    this.chartOptions3 = {
      series: [{ name: 'Correlation', data: [] }],
      chart: {
        height: 280,
        type: 'scatter',
        zoom: { enabled: true, type: 'xy' },
        events: {
          // click opens course details in a new tab
          dataPointSelection: (_ev, _ctx, cfg) => {
            const i = cfg?.dataPointIndex ?? -1;
            const pt = this.scatterPoints[i];
            if (!pt) return;
            if (pt.id) {
              window.open(`/course-detail/${pt.id}`, '_blank');
            } else if (pt.name) {
              const tree = this.router.createUrlTree(['/course-detail-by-name'], { queryParams: { name: pt.name } });
              window.open(this.router.serializeUrl(tree), '_blank');
            }
          }
        }
      },
      markers: { size: 7, strokeWidth: 1, hover: { size: 9 } },
      xaxis: {
        tickAmount: 10,
        labels: { formatter: (v: any) => parseFloat(String(v)).toFixed(1) },
        title: { text: 'Course Price' }
      },
      yaxis: {
        tickAmount: 7,
        title: { text: 'Course Rating', style: { fontSize: '12px' } }
      },
      title: { text: 'Correlation between ratings & prices of courses' },
      tooltip: {
        enabled: true,
        shared: false,
        intersect: true,
        custom: ({ seriesIndex, dataPointIndex, w }) => {
          const pt: any = w?.config?.series?.[seriesIndex]?.data?.[dataPointIndex] ?? {};
          const name = pt?.name ?? '';
          const x = Number(pt?.x ?? 0);
          const y = Number(pt?.y ?? 0);
          return `
            <div style="background:#fff;border:1px solid #e5e7eb;border-radius:8px;box-shadow:0 6px 16px rgba(0,0,0,.08);padding:10px 12px;min-width:220px;font:12px/1.4 system-ui;color:#111827">
              <div style="font-weight:600;margin-bottom:6px">${name}</div>
              <div style="display:flex;gap:10px">
                <div>Price: <strong>${x.toFixed(2)}</strong></div>
                <div>Rating: <strong>${y.toFixed(1)}</strong></div>
              </div>
              <div style="margin-top:6px;color:#6b7280;">Click to see the course details</div>
            </div>`;
        }
      }
    };
  }

  ngOnInit(): void {
    this.platform = (this.route.snapshot.paramMap.get('platform') ?? '').toLowerCase();
    this.platform = this.platform.trim().replace(/\s+/g, ' ');
    this.getPopularCourses(this.platform, this.dataPointCount);
    this.getPopularCategories(this.platform, this.dataPointCount2);
    this.getCoursesRatingsPrices(this.platform, this.dataPointCount3);
  }

  /* -------- Data loaders -------- */

  getPopularCourses(platform: string, n: number) {
    this.svc.getCoursesByPopularityForVis(platform, n).then(courses => {
      if (!courses || courses.length === 0) { this.hasCoursesEnrolledStudents = false; return; }
      this.hasCoursesEnrolledStudents = true;

      this.numberOfParticipants = courses.map(c => +c.NumberOfParticipants);
      this.courseName = courses.map(c => c.CourseName.slice(0, 20));
      this.courseIds = courses.map(c => c.CourseId);

      this.chartOptions!.series = [{
        name: 'Number of Participants',
        data: this.numberOfParticipants.map((y, i) => ({ x: this.courseName[i], y, id: courses[i].CourseId }))
      }];
      this.chartOptions!.xaxis = { categories: this.courseName, title: { text: 'Number of Enrolled Students' } };
      this.chartOptions!.yaxis = { title: { text: 'Course Name', style: { fontSize: '12px' } } };

      this.redraw('courses');
    });
  }

  getPopularCategories(platform: string, n: number) {
    this.svc.getCategoryByPopularityForVis(platform, n).then(rows => {
      if (!rows || rows.length === 0) { this.hasCategoriesEnrolledStudents = false; return; }
      this.hasCategoriesEnrolledStudents = true;

      this.totalParticipants = rows.map(r => +r.TotalParticipants);
      this.courseCategories = rows.map(r => r.CourseCategory);

      this.chartOptions2!.series = [{ name: 'Total Participants', data: this.totalParticipants }];
      this.chartOptions2!.xaxis  = { categories: this.courseCategories, title: { text: 'Number of Enrolled Students' } };
      this.chartOptions2!.yaxis  = { title: { text: 'Course Category', style: { fontSize: '12px' } } };

      this.redraw('cats');
    });
  }

  getCoursesRatingsPrices(platform: string, n: number) {
    this.svc.getCoursesRatingsPricesForVis(platform, n).then((rows: CoursesRatingsPricesForVis[]) => {
      const points = (rows || [])
        .map(r => ({
          x: Number((r as any).CoursePrice),
          y: Number((r as any).CourseRating),
          name: (r as any).CourseName,
          id:   (r as any).CourseId
        }))
        .filter(p => Number.isFinite(p.x) && Number.isFinite(p.y));

      this.hasPriceAndRatings = points.length > 0;
      this.scatterPoints = points;

      this.chartOptions3!.series = [{ name: 'Correlation', data: points }];
      this.redraw('scatter');
    });
  }

  /* -------- Category → courses -------- */

  onCategoryClick(name: string) {
    this.selectedCategory   = name;
    this.loadingCategory    = true;
    this.coursesForCategory = [];

    this.svc.getCoursesByCourseCategory(name, true)
      .then((list: any[]) => {
        const mapped: CourseListRow[] = (Array.isArray(list) ? list : []).map((r: any, idx: number) => ({
          Id: idx + 1,
          CourseId: r.CourseId,
          CourseName: r.Name ?? r.CourseName,
          Rating: Number(r?.Rating ?? 0) || 0,
          NumberOfParticipants: Number(String(r?.NumberOfParticipants ?? '0').replace(/,/g, '')) || 0,
          Language: r.Language,
          Level: r.Level,
          Platform: r.PlatformName
        }));
        this.coursesForCategory = mapped;
      })
      .finally(() => (this.loadingCategory = false));
  }

  onCategoryBack() {
    this.selectedCategory   = null;
    this.coursesForCategory = [];
  }

  /* -------- Sliders -------- */

  onDataChange(n: number)  { this.dataPointCount  = n; this.getPopularCourses(this.platform, n); }
  onDataChange2(n: number) { this.dataPointCount2 = n; this.getPopularCategories(this.platform, n); }
  onDataChange3(n: number) { this.dataPointCount3 = n; this.getCoursesRatingsPrices(this.platform, n); }

  /* -------- Tiny redraw helper -------- */

  private redraw(which: 'courses' | 'cats' | 'scatter') {
    if (which === 'courses') {
      this.coursesChartVisible = false; this.cdr.detectChanges();
      setTimeout(() => { this.coursesChartVisible = true; this.cdr.detectChanges(); }, 0);
    } else if (which === 'cats') {
      this.catsChartVisible = false; this.cdr.detectChanges();
      setTimeout(() => { this.catsChartVisible = true; this.cdr.detectChanges(); }, 0);
    } else {
      this.scatterChartVisible = false; this.cdr.detectChanges();
      setTimeout(() => { this.scatterChartVisible = true; this.cdr.detectChanges(); }, 0);
    }
  }
}
