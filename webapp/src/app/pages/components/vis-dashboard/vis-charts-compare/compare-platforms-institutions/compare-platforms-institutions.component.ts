/*import { Component,OnInit,ViewChild } from '@angular/core';
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
import {
  VisSelectedPlatformsCompareService
} from "../../../../../services/vis-dashboard/vis-selected-platforms-compare.service";
import {useSelectedPlatforms} from "../../../../../utils/useSelectedPlatforms";

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
  selectedPlatformsFromStorage: string[] = [];

  platformNames: string[]
  numberOfInstitution: number[]


  ngOnInit(): void {
    this.loadSelectedPlatformsFromStorage();
    this.loadSelectedPlatforms()

    this.getPlatformsByInstitutionCount(useSelectedPlatforms(this.selectedPlatforms,this.selectedPlatformsFromStorage))
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
      this.selectedPlatformsFromStorage = JSON.parse(storedPlatforms);
    }
  }


  constructor(private visdashboardService: VisDashboardService,
              private platformFilterCompareService: PlatformFilterCompareService,
              private readonly visSelectedPlatformsCompare: VisSelectedPlatformsCompareService
              ) {
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
  loadSelectedPlatforms(): void {
    this.visSelectedPlatformsCompare.getSelectedPlatforms().subscribe(platforms=>{
      this.selectedPlatforms = platforms
    })
  }

  // Await the result and update the chart component
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
}*/

import { Component, OnInit, ViewChild } from '@angular/core';
import {
  ChartComponent, ApexAxisChartSeries, ApexChart, ApexXAxis,
  ApexTitleSubtitle, ApexPlotOptions, ApexTooltip
} from 'ng-apexcharts';
import { VisDashboardService, CourseListRow } from '../../../../../services/vis-dashboard/vis-dashboard.service';
import { PlatformFilterCompareService } from '../../../../../services/vis-dashboard/platform-filter-compare.service';
import { VisSelectedPlatformsCompareService } from '../../../../../services/vis-dashboard/vis-selected-platforms-compare.service';
import { useSelectedPlatforms } from '../../../../../utils/useSelectedPlatforms';
import { PlatformColorRegistry } from '../../../../../services/vis-dashboard/platform-color-registry.service';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  plotOptions: ApexPlotOptions;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  colors?: string[];
};

@Component({
  selector: 'app-compare-platforms-institutions',
  templateUrl: './compare-platforms-institutions.component.html',
  styleUrls: ['./compare-platforms-institutions.component.css']
})
export class ComparePlatformsInstitutionsComponent implements OnInit {
  @ViewChild('chart', { static: false }) chart!: ChartComponent;

  public chartOptions: Partial<ChartOptions>;

  // platform filters
  selectedPlatforms: string[] = [];
  selectedPlatformsFromStorage: string[] = [];
  platformNames: string[] = [];
  numberOfInstitution: number[] = [];

  // panels state (SAME SHAPE AS TEACHERS)
  platformNameForPanels = '';

  // LEFT: institutions list
  leftItems: Array<{ id: string | number; name: string; courseCount?: number }> = [];
  leftTotal = 0;
  leftPage = 1;
  leftPageSize = 10;

  selectedInstitution: { id: number | string; name: string } | null = null;

  // RIGHT: courses for selected institution (full list; child paginates)
  rightItems: CourseListRow[] = [];
  rightTotal = 0;
  rightPage = 1;
  rightPageSize = 5;

  // sort (rating) — default high → low
  sortAsc = false;

  constructor(
    private visdashboardService: VisDashboardService,
    private platformFilterCompare: PlatformFilterCompareService,
    private readonly visSelectedPlatformsCompare: VisSelectedPlatformsCompareService,
    private readonly colors: PlatformColorRegistry
  ) {
    this.chartOptions = {
      series: [{ name: 'Total Number of Institutions', data: [] }],
      chart: {
        height: 280,
        type: 'bar',
        toolbar: { show: true },
        events: {
          dataPointSelection: (_e, _ctx, cfg) => {
            const platform = this.platformNames?.[cfg.dataPointIndex];
            if (platform) this.onPlatformBarClick(platform);
          }
        }
      },
      plotOptions: { bar: { horizontal: true, barHeight: '60%', distributed: true } }, // ← per-bar colors
      title: { text: 'Number of Institutions in Platforms' },
      xaxis: { categories: [] },
      tooltip: {
        custom: ({ series, seriesIndex, dataPointIndex, w }) => {
          const category = w?.config?.xaxis?.categories?.[dataPointIndex] ?? '';
          const val = series?.[seriesIndex]?.[dataPointIndex] ?? '';
          return `
            <div class="pp-tooltip">
              <div class="pp-tooltip-title">${category}</div>
              <div class="pp-tooltip-row">
                <span class="pp-dot"></span>
                Total Number of Institutions:&nbsp;<b>${val}</b>
              </div>
              <div class="pp-tooltip-note">Click to see more detailed list</div>
            </div>`;
        }
      },
      colors: [] // will be filled per dataset load
    };
  }

  ngOnInit(): void {
    this.loadSelectedPlatformsFromStorage();
    this.loadSelectedPlatforms();

    this.getPlatformsByInstitutionCount(useSelectedPlatforms(this.selectedPlatforms, this.selectedPlatformsFromStorage));

    this.platformFilterCompare.getLanguageFilter().subscribe((platforms) => {
      if (platforms && platforms.length) this.getPlatformsByInstitutionCount(platforms);
    });
  }

  private loadSelectedPlatformsFromStorage(): void {
    const stored = localStorage.getItem('selectedPlatforms');
    if (stored) this.selectedPlatformsFromStorage = JSON.parse(stored);
  }
  private loadSelectedPlatforms(): void {
    this.visSelectedPlatformsCompare.getSelectedPlatforms().subscribe((plats) => {
      this.selectedPlatforms = plats;
    });
  }

  getPlatformsByInstitutionCount(platforms: string[]) {
    this.visdashboardService.getPlatformsByInstitutionCount(platforms).then((rows: any[]) => {
      // Normalize + sort (desc) – largest at top as you currently have it
      const sorted = [...(rows ?? [])]
        .map(r => ({
          PlatformName: r.PlatformName,
          InstitutionCount: Number(r.InstitutionCount) || 0
        }))
        .sort((a, b) => b.InstitutionCount - a.InstitutionCount);

      this.platformNames       = sorted.map(r => r.PlatformName);
      this.numberOfInstitution = sorted.map(r => r.InstitutionCount);

      const nextSeries = [{ name: 'Total Number of Institutions', data: this.numberOfInstitution }];
      const nextXaxis  = { categories: this.platformNames };
      const nextColors = this.colors.paletteFor(this.platformNames); // ← exact legend colors per platform

      this.chartOptions = { ...this.chartOptions, series: nextSeries, xaxis: nextXaxis, colors: nextColors };
      this.chart?.updateOptions(
        { series: nextSeries as any, xaxis: nextXaxis as any, colors: nextColors as any },
        true, true, true
      );

      this.resetPanels();
    });
  }

  /** when a bar is clicked */
  private onPlatformBarClick(platform: string) {
    this.platformNameForPanels = platform;
    this.leftPage = 1;
    this.fetchInstitutions();
  }

  /** LEFT LIST: institutions in a platform (paged) */
  private async fetchInstitutions(q = '') {
    // expected shape: { items: [...], total }
    const res = await (this.visdashboardService as any).getInstitutionsByPlatform(
      this.platformNameForPanels, this.leftPage, this.leftPageSize, q
    );

    this.leftItems = (res.items || []).map((t: any) => ({
      id: t.id ?? t.InstitutionId ?? t.institutionId ?? t.Id,
      name: t.name ?? t.InstitutionName ?? t.institutionName ?? '—',
      courseCount: t.courseCount ?? t.NumOfCourses ?? t.numOfCourses
    }));
    this.leftTotal = res.total ?? this.leftItems.length;

    // reset right side on platform/page change
    this.selectedInstitution = null;
    this.rightItems = [];
    this.rightTotal = 0;
    this.rightPage = 1;
  }

  /** pagination from child */
  onLeftPageChange = (page: number) => {
    this.leftPage = page;
    this.fetchInstitutions();
  };
  onRightPageChange = (page: number) => {
    this.rightPage = page;
  };

  /** when an institution is chosen on the left */
  onInstitutionSelected = (inst: { id: number | string; name: string }) => {
    this.selectedInstitution = inst;
    this.loadInstitutionCourses();
  };

  /** RIGHT LIST: courses for the selected institution */
  private async loadInstitutionCourses() {
    if (!this.selectedInstitution || !this.platformNameForPanels) return;

    const idNum = Number(this.selectedInstitution.id);
    const rows = Number.isFinite(idNum)
      ? await (this.visdashboardService as any).getInstitutionCoursesForVisById(this.platformNameForPanels, idNum)
      : await (this.visdashboardService as any).getInstitutionCoursesForVisByName(
          this.platformNameForPanels, String(this.selectedInstitution.name)
        );

    this.rightItems = rows || [];
    this.rightTotal = this.rightItems.length;
    this.rightPage = 1;
    this.applySort();
  }

  /** rating sort (desc default like teachers) */
  onSortCoursesByRating = (direction: 'asc' | 'desc') => {
    this.sortAsc = direction === 'asc';
    this.applySort();
  };
  private getRating = (r: any): number => {
    const raw = r?.Rating ?? r?.rating ?? r?.Rank ?? 0;
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
    return Number.isFinite(n) ? n : 0;
  };
  private applySort() {
    const dir = this.sortAsc ? 1 : -1;
    this.rightItems = [...this.rightItems].sort((a: any, b: any) =>
      (this.getRating(a) - this.getRating(b)) * dir || (a.CourseName || '').localeCompare(b.CourseName || '')
    );
  }

  /** open course in new tab (kept loose to match child payload) */
  onCourseInspect = (c: any) => {
    const courseId = (c?.id ?? c?.CourseId) as string | number | undefined;
    if (courseId != null) window.open(`/course-detail/${courseId}`, '_blank');
  };

  private resetPanels() {
    this.platformNameForPanels = '';
    this.leftItems = [];
    this.leftTotal = 0;
    this.leftPage = 1;
    this.rightItems = [];
    this.rightTotal = 0;
    this.rightPage = 1;
    this.selectedInstitution = null;
  }
}
