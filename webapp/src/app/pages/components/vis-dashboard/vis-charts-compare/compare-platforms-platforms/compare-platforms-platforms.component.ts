/*import { Component,OnInit, ViewChild } from '@angular/core';
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

  // Get response data and update the chart
getNumberOfParticipantsForCompare(platforms:string[]){
    this.visDashboardServices.getPlatformsByParticipants(platforms)
      .then((platforms)=>{
        this.chartOptions.series = platforms.map(platform=> platform.TotalParticipants)
        const j = platforms.map((platform)=>{
          if(platform.TotalParticipants === 0){
            return 'no data for ' + platform.PlatformName
          }
          return platform.PlatformName
        })
        this.chartOptions.labels = j
      })
}


}*/

import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { ChartComponent } from 'ng-apexcharts';
import { Router } from '@angular/router';
import {
  VisDashboardService,
  CourseLite
} from '../../../../../services/vis-dashboard/vis-dashboard.service';
import { PlatformFilterCompareService } from '../../../../../services/vis-dashboard/platform-filter-compare.service';
import { VisSelectedPlatformsCompareService } from '../../../../../services/vis-dashboard/vis-selected-platforms-compare.service';
import { useSelectedPlatforms } from '../../../../../utils/useSelectedPlatforms';

import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { PlatformColorRegistry } from '../../../../../services/vis-dashboard/platform-color-registry.service';

@Component({
  selector: 'app-compare-platforms-platforms',
  templateUrl: './compare-platforms-platforms.component.html',
  styleUrls: ['./compare-platforms-platforms.component.css']
})
export class ComparePlatformsPlatformsComponent implements OnInit, OnDestroy {
  @ViewChild('chart', { static: false }) chart!: ChartComponent;

  chartOptions: any;

  selectedPlatforms: string[] = [];
  selectedPlatformsFromStorage: string[] = [];
  private currentPlatforms: string[] = [];

  courses: CourseLite[] = [];
  total = 0;
  page = 1;
  pageSize = 10;
  get pageCount() { return Math.max(Math.ceil(this.total / this.pageSize), 1); }
  get startIndex() { return this.total ? (this.page - 1) * this.pageSize + 1 : 0; }
  get endIndex()   { return Math.min(this.page * this.pageSize, this.total); }

  selectedPlatform: string | null = null;

  ratingFilter: 'all' | '4+' | '3+' = 'all';
  minRating = 0;

  q = '';
  private search$ = new Subject<string>();
  private searchSub?: Subscription;
  sort: 'enrolled' | 'rating' | 'name' = 'rating';
  order: 'asc' | 'desc' = 'desc';

  constructor(
    private readonly visDashboardServices: VisDashboardService,
    private readonly platformFilterCompare: PlatformFilterCompareService,
    private readonly visSelectedPlatformsCompare: VisSelectedPlatformsCompareService,
    private readonly router: Router,
    private readonly colors: PlatformColorRegistry
  ) {
    this.chartOptions = {
      chart: {
        type: 'pie',
        height: 280,
        events: {
          dataPointSelection: (_ev: any, chartCtx: any, cfg: any) => {
            const idx = cfg?.dataPointIndex;
            const label = chartCtx?.w?.globals?.labels?.[idx];
            if (!label || /^no data for /i.test(label)) return;
            const platform = label.replace(/^no data for /i, '');
            this.onSliceClick(platform);
          },
          click: (_ev: any, chartCtx: any, cfg: any) => {
            const idx = cfg?.dataPointIndex;
            if (typeof idx !== 'number' || idx < 0) return;
            const label = chartCtx?.w?.globals?.labels?.[idx];
            if (!label || /^no data for /i.test(label)) return;
            const platform = label.replace(/^no data for /i, '');
            this.onSliceClick(platform);
          }
        }
      },
      title: { text: 'Total Number of Participants' },
      colors: [],
      labels: [],
      series: [],
      tooltip: {
        custom: ({ series, seriesIndex, w }) => {
          const label = w.config.labels[seriesIndex];
          const value = series[seriesIndex];
          return `
            <div class="apx-tooltip">
              <div><b>${label}</b>: ${Number(value).toLocaleString()}</div>
              <div class="apx-hint">Click to see list of courses in this platform</div>
            </div>`;
        }
      }
    };
  }

  ngOnInit(): void {
    this.loadSelectedPlatformsFromStorage();
    this.loadSelectedPlatforms();

    const initial = useSelectedPlatforms(this.selectedPlatforms, this.selectedPlatformsFromStorage);
    this.currentPlatforms = initial.slice();

    this.getNumberOfParticipantsForCompare(initial);
    this.fetchCourses();

    this.platformFilterCompare.getLanguageFilter().subscribe((platforms) => {
      if (!platforms?.length) return;
      this.currentPlatforms = platforms.slice();
      this.selectedPlatform = null;
      this.page = 1;
      this.getNumberOfParticipantsForCompare(platforms);
      this.fetchCourses();
    });

    this.searchSub = this.search$
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((term) => {
        this.q = term;
        this.page = 1;
        this.fetchCourses();
      });
  }

  ngOnDestroy(): void { this.searchSub?.unsubscribe(); }

  private loadSelectedPlatformsFromStorage(): void {
    const stored = localStorage.getItem('selectedPlatforms');
    if (stored) this.selectedPlatformsFromStorage = JSON.parse(stored);
  }
  private loadSelectedPlatforms(): void {
    this.visSelectedPlatformsCompare.getSelectedPlatforms().subscribe((p) => (this.selectedPlatforms = p));
  }

  private getNumberOfParticipantsForCompare(platforms: string[]) {
    this.visDashboardServices.getPlatformsByParticipants(platforms).then((rows) => {
      const series = rows.map((r) => Number(r.TotalParticipants || 0));
      const labels = rows.map((r) =>
        Number(r.TotalParticipants || 0) === 0 ? `no data for ${r.PlatformName}` : r.PlatformName
      );

      const baseNames = labels.map(lbl => lbl.replace(/^no data for /i, ''));
      const palette = this.colors.paletteFor(baseNames);

      if (this.chart) this.chart.updateOptions({ labels, series, colors: palette }, true, true, true);
      this.chartOptions = { ...this.chartOptions, labels: [...labels], series: [...series], colors: palette };
    });
  }

  private fetchCourses() {
    const opts: Parameters<VisDashboardService['getPlatformCourses']>[0] = {
      page: this.page, pageSize: this.pageSize, q: this.q.trim(),
      sort: this.sort, order: this.order, minRating: this.minRating
    };

    if (this.selectedPlatform) opts.platform = this.selectedPlatform;
    else if (this.currentPlatforms?.length) opts.platforms = this.currentPlatforms;

    this.visDashboardServices.getPlatformCourses(opts).then((data) => {
      this.total = data.total ?? 0;
      this.courses = data.items ?? [];
    });
  }

  private onSliceClick(platform: string) { this.selectedPlatform = platform; this.page = 1; this.fetchCourses(); }
  resetPlatform() { this.selectedPlatform = null; this.page = 1; this.fetchCourses(); }

  onRatingFilterChange(v: string) {
    this.ratingFilter = (v as any) || 'all';
    this.minRating = this.ratingFilter === '4+' ? 4 : this.ratingFilter === '3+' ? 3 : 0;
    this.page = 1;
    this.fetchCourses();
  }

  onSearchInput(value: string) { this.search$.next(value || ''); }
  onSortRatingClick() { this.sort = 'rating'; this.order = this.order === 'asc' ? 'desc' : 'asc'; this.page = 1; this.fetchCourses(); }
  onSortEnrolledClick() { this.sort = 'enrolled'; this.order = this.order === 'asc' ? 'desc' : 'asc'; this.page = 1; this.fetchCourses(); }

  onPageSizeChange(v: string) {
    const n = Math.max(1, Math.min(50, parseInt(v || '10', 10)));
    if (n !== this.pageSize) { this.pageSize = n; this.page = 1; this.fetchCourses(); }
  }
  prevPage() { if (this.page > 1) { this.page--; this.fetchCourses(); } }
  nextPage() { if (this.page < this.pageCount) { this.page++; this.fetchCourses(); } }

  getStripeColor(platform: string) { return this.colors.getColor(platform); }
  openCourseInNewTab(c: CourseLite) { const id = encodeURIComponent(String(c.courseId ?? c.id)); window.open(`/course-detail/${id}`, '_blank', 'noopener'); }
  truncate(name: string, max = 80): string { return name.length > max ? name.slice(0, max - 1) + '…' : name; }
}
