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
  selector: 'app-compare-platforms-teachers',
  templateUrl: './compare-platforms-teachers.component.html',
  styleUrls: ['./compare-platforms-teachers.component.css']
})
export class ComparePlatformsTeachersComponent implements OnInit {
  @ViewChild('chart', { static: false }) chart!: ChartComponent;

  public chartOptions: Partial<ChartOptions>;

  selectedPlatforms: string[] = [];
  selectedPlatformsFromStorage: string[] = [];
  platformNames: string[] = [];
  numberOfTeachers: number[] = [];

  /* panels */
  platformNameForPanels = '';

  /* LEFT (teachers) */
  leftItems: Array<{ id: string | number; name: string; courseCount?: number }> = [];
  leftTotal = 0;
  leftPage = 1;
  leftPageSize = 10;

  /* selection */
  selectedTeacher: { id: number | string; name: string } | null = null;

  /* RIGHT (courses) – full list; child slices 5 per page */
  rightItems: CourseListRow[] = [];
  rightTotal = 0;
  rightPage = 1;
  rightPageSize = 5;

  /* sorting (rating) – default high -> low */
  sortAsc = false;

  constructor(
    private visdashboardService: VisDashboardService,
    private platformFilterCompare: PlatformFilterCompareService,
    private readonly visSelectedPlatformsCompare: VisSelectedPlatformsCompareService,
    private readonly colors: PlatformColorRegistry
  ) {
    this.chartOptions = {
      series: [{ name: 'Total Number of Teachers', data: [] }],
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
      title: { text: 'Number of Teachers in Platforms' },
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
                Total Number of Teachers:&nbsp;<b>${val}</b>
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

    this.getPlatformsByTeacherCount(
      useSelectedPlatforms(this.selectedPlatforms, this.selectedPlatformsFromStorage)
    );

    this.platformFilterCompare.getLanguageFilter().subscribe((platforms) => {
      if (platforms && platforms.length) this.getPlatformsByTeacherCount(platforms);
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

  private getPlatformsByTeacherCount(platforms: string[]): void {
    this.visdashboardService.getPlatformsByTeacherCount(platforms).then((rows: any[]) => {
      // Normalize + sort (desc) – largest at top as you currently have it
      const sorted = [...(rows ?? [])]
        .map(r => ({
          PlatformName: r.PlatformName,
          TeacherCount: Number(r.TeacherCount) || 0
        }))
        .sort((a, b) => b.TeacherCount - a.TeacherCount);

      this.platformNames    = sorted.map(r => r.PlatformName);
      this.numberOfTeachers = sorted.map(r => r.TeacherCount);

      const nextSeries = [{ name: 'Total Number of Teachers', data: this.numberOfTeachers }];
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

  private onPlatformBarClick(platform: string) {
    this.platformNameForPanels = platform;
    this.leftPage = 1;
    this.fetchTeachers();
  }

  private async fetchTeachers(q = '') {
    const res = await this.visdashboardService.getTeachersByPlatform(
      this.platformNameForPanels, this.leftPage, this.leftPageSize, q
    );

    this.leftItems = (res.items || []).map((t: any) => ({
      id: t.id ?? t.TeacherId ?? t.teacherId ?? t.Id,
      name: t.name ?? t.TeacherName ?? t.teacherName ?? '—',
      courseCount: t.courseCount ?? t.NumOfCourses ?? t.numOfCourses
    }));
    this.leftTotal = res.total ?? this.leftItems.length;

    /* reset right side when platform/page changes */
    this.selectedTeacher = null;
    this.rightItems = [];
    this.rightTotal = 0;
    this.rightPage = 1;
  }

  /* pagination */
  onLeftPageChange = (page: number) => {
    this.leftPage = page;
    this.fetchTeachers();
  };

  onRightPageChange = (page: number) => {
    this.rightPage = page;
  };

  onTeacherSelected = (teacher: { id: number | string; name: string }) => {
    this.selectedTeacher = teacher;
    this.loadTeacherCourses();
  };

  private async loadTeacherCourses() {
    if (!this.selectedTeacher || !this.platformNameForPanels) return;

    const idNum = Number(this.selectedTeacher.id);
    const rows = Number.isFinite(idNum)
      ? await this.visdashboardService.getTeacherCoursesForVisById(this.platformNameForPanels, idNum)
      : await this.visdashboardService.getTeacherCoursesForVisByName(this.platformNameForPanels, String(this.selectedTeacher.name));

    this.rightItems = rows || [];
    this.rightTotal = this.rightItems.length;
    this.rightPage  = 1;

    this.applySort(); /* keep current sort */
  }

  /* sort by rating (desc default) */
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
    this.selectedTeacher = null;
  }
}
