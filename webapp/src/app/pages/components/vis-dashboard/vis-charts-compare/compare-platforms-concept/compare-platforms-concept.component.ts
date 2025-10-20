/*import { Component,OnInit } from '@angular/core';
import {
  Concept,
  VisDashboardService,
  CourseConceptCompare,
} from "../../../../../services/vis-dashboard/vis-dashboard.service";
import { Router} from "@angular/router";
import {PlatformFilterCompareService} from "../../../../../services/vis-dashboard/platform-filter-compare.service";
import {
  VisSelectedPlatformsCompareService
} from "../../../../../services/vis-dashboard/vis-selected-platforms-compare.service";
import {useSelectedPlatforms} from "../../../../../utils/useSelectedPlatforms";
import {usePopularWords} from "../../../../../utils/usePopularWords";

interface Word {
  text: string,
  value: number,
  font: string,
  style: string,
  weight: string,
}

@Component({
  selector: 'app-compare-platforms-concept',
  templateUrl: './compare-platforms-concept.component.html',
  styleUrls: ['./compare-platforms-concept.component.css']
})
export class ComparePlatformsConceptComponent implements  OnInit{
  selectedPlatforms: string[]
  selectedPlatforms2: string[]
  concepts: Concept[]
  data: { text: string; value: number; }[] = [{"text": "test", value: 0}]
  words: string[]
  selectedTopic: string
  relatedCourses: CourseConceptCompare[] = []
  topicClicked: boolean = false
  isCloudLoading: boolean = true

  constructor(
              private visDashboardService: VisDashboardService,
              private router: Router,
              private readonly visSelectedPlatformsCompare: VisSelectedPlatformsCompareService,
              private platformFilterCompare:PlatformFilterCompareService) {
  }

  ngOnInit(): void {
    this.loadSelectedPlatforms()
    this.loadSelectedPlatformsFromStorage();
   this.getConceptsByPlatforms(useSelectedPlatforms(this.selectedPlatforms,this.selectedPlatforms2))

    this.platformFilterCompare.getLanguageFilter().subscribe(platforms=>{
      if(platforms.length === 0 ){
        return
      }
      else{
        this.getConceptsByPlatforms(platforms)
      }
    })

  }

  loadSelectedPlatformsFromStorage(): void {
    const storedPlatforms = localStorage.getItem('selectedPlatforms');
    if (storedPlatforms) {
      this.selectedPlatforms = JSON.parse(storedPlatforms);
    }
  }

  loadSelectedPlatforms(): void {
    this.visSelectedPlatformsCompare.getSelectedPlatforms().subscribe(platforms=>{
   this.selectedPlatforms2 = platforms
    })
  }


  // await response and update the word cloud
  getConceptsByPlatforms(platforms: string[]) {
    this.isCloudLoading = true
    this.visDashboardService.getConceptsByPlatforms(platforms)
      .then((concepts) => {
        this.concepts = concepts
        this.words = this.concepts.map(c => c.ConceptName)
        const {data}= usePopularWords(this.words)
        this.data = data
        this.isCloudLoading = false
      })

  }



  getCoursesByPlatformAndConcepts(platforms: string[], concept: string) {
    this.visDashboardService.getCoursesByConceptForCompare(platforms,concept)
      .then((courses) => {
        this.relatedCourses = courses
      })
  }


  // Get course list on concept click
  onWorkClick(eventData: { event: MouseEvent; word: Word }) {
    this.selectedTopic = eventData.word.text
    this.getCoursesByPlatformAndConcepts(this.selectedPlatforms2, this.selectedTopic)
    this.topicClicked = true
  }


  onCourseClick(CourseId: string) {
    this.router.navigate(['course-detail', CourseId])
  }

}*/

import {
  Component, OnInit, OnDestroy, ChangeDetectorRef,
  ViewChild, ElementRef, NgZone
} from '@angular/core';
import { combineLatest, Subject } from 'rxjs';
import { startWith } from 'rxjs/operators';

import {
  VisDashboardService,
  CourseConceptCompare
} from '../../../../../services/vis-dashboard/vis-dashboard.service';
import { PlatformFilterCompareService } from '../../../../../services/vis-dashboard/platform-filter-compare.service';
import { VisSelectedPlatformsCompareService } from '../../../../../services/vis-dashboard/vis-selected-platforms-compare.service';
import { useSelectedPlatforms } from '../../../../../utils/useSelectedPlatforms';
import { PlatformColorRegistry } from '../../../../../services/vis-dashboard/platform-color-registry.service';

interface Word {
  text: string;
  size: number;
  value?: number;
}

type SortKey = 'rating' | 'students';

type Row = CourseConceptCompare & {
  Platform: string;
  Students?: number | null;
  CourseId: string;
  CourseName: string;
  Rating?: number | string | null;
};

@Component({
  selector: 'app-compare-platforms-concept',
  templateUrl: './compare-platforms-concept.component.html',
  styleUrls: ['./compare-platforms-concept.component.css']
})
export class ComparePlatformsConceptComponent implements OnInit, OnDestroy {
  @ViewChild('cloudHost', { static: true }) cloudHost!: ElementRef<HTMLDivElement>;
  cloudWidth = 900;

  isCloudLoading = true;
  data: Word[] = [];

  private activePlatforms: string[] = [];
  private resizeObs?: ResizeObserver;

  selectedTopic = '';
  relatedCourses: Row[] = [];

  // sorting
  sort: SortKey = 'rating';
  order: 'asc' | 'desc' = 'desc';

  // pagination (client-side)
  page = 1;
  pageSize = 10;
  get total() { return this.relatedCourses.length; }
  get pageCount() { return Math.max(Math.ceil(this.total / this.pageSize), 1); }
  get startIndex() { return this.total ? (this.page - 1) * this.pageSize + 1 : 0; }
  get endIndex()   { return Math.min(this.page * this.pageSize, this.total); }

  /** Legend order (display only) */
  private readonly legendOrder = [
    'On Campus', 'KI Campus', 'OpenVhb', 'OpenHPI', 'EdX', 'Coursera', 'IMoox', 'Udemy', 'Udacity'
  ];

  private destroy$ = new Subject<void>();
  trackCourse = (_: number, c: Row) => c.CourseId;

  constructor(
    private readonly visDashboardService: VisDashboardService,
    private readonly platformFilterCompare: PlatformFilterCompareService,
    private readonly selectedPlatformsSvc: VisSelectedPlatformsCompareService,
    private readonly cdr: ChangeDetectorRef,
    private readonly zone: NgZone,
    private readonly colors: PlatformColorRegistry
  ) {}

  ngOnInit(): void {
    // responsive cloud width
    this.zone.runOutsideAngular(() => {
      this.resizeObs = new ResizeObserver(() => {
        const w = Math.max(600, this.cloudHost?.nativeElement?.clientWidth || 900);
        if (w !== this.cloudWidth) {
          this.zone.run(() => (this.cloudWidth = w));
        }
      });
      this.resizeObs.observe(this.cloudHost.nativeElement);
    });

    const stored$ = this.selectedPlatformsSvc.getSelectedPlatforms().pipe(startWith([] as string[]));
    const lang$   = this.platformFilterCompare.getLanguageFilter().pipe(startWith([] as string[]));

    combineLatest([stored$, lang$]).subscribe(([picked, lang]) => {
      const fromLocal = JSON.parse(localStorage.getItem('selectedPlatforms') || '[]') as string[];
      const platforms = useSelectedPlatforms(picked, fromLocal);
      this.activePlatforms = (lang?.length ? lang : platforms) ?? [];
      this.loadCloud(this.activePlatforms);
    });
  }

  ngOnDestroy(): void {
    this.resizeObs?.disconnect();
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** Word cloud loader */
  private async loadCloud(platforms: string[]): Promise<void> {
    this.isCloudLoading = true;
    this.data = [];
    this.selectedTopic = '';
    this.relatedCourses = [];
    this.page = 1;
    this.cdr.detectChanges();

    try {
      let list = await this.visDashboardService.getConceptsByPlatforms(platforms);

      // fallback: merge per-platform if bulk endpoint empty
      if (!list?.length) {
        const acc = new Map<string, number>();
        for (const p of platforms) {
          const rows = await this.visDashboardService.getConceptsByPlatform(p);
          (rows || []).forEach(r => {
            const key = (r?.ConceptName || '').trim();
            if (!key) return;
            const inc = Number(r?.Count || 1);
            acc.set(key, (acc.get(key) || 0) + (Number.isFinite(inc) ? inc : 1));
          });
        }
        list = Array.from(acc.entries()).map(([ConceptName, Count]) => ({ ConceptName, Count }));
      }

      const TOP = 150;
      const safe = (list || [])
        .filter(r => r?.ConceptName)
        .map(r => ({ name: r.ConceptName, count: Number(r.Count || 1) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, TOP);

      if (!safe.length) { this.data = []; return; }

      const counts = safe.map(s => s.count);
      const min = Math.min(...counts);
      const max = Math.max(...counts);
      const scale = (v: number) => max === min ? 36 : 18 + ((v - min) / (max - min)) * (72 - 18);

      this.data = safe.map(s => ({ text: s.name, size: Math.round(scale(s.count)), value: s.count }));
    } catch (e) {
      console.error('[Compare Cloud] loadCloud error:', e);
      this.data = [];
    } finally {
      this.isCloudLoading = false;
      this.cdr.detectChanges();
    }
  }

  /** Click a word → fetch courses */
  async onWordClick(e: { event: MouseEvent; word: { text: string } }): Promise<void> {
    if (!(e as any)?.word?.text) return;
    this.selectedTopic = (e as any).word.text;
    this.page = 1;

    try {
      let rows = await this.visDashboardService
        .getCoursesByConceptForCompare(this.activePlatforms, this.selectedTopic);

      // --- Fallback per platform and tag the platform on each row ---
      if (!rows?.length && this.activePlatforms?.length) {
        const all: any[] = [];
        for (const p of this.activePlatforms) {
          const chunk = await this.visDashboardService
            .getCoursesByConceptAndPlatform(p, this.selectedTopic);
          (chunk || []).forEach(r => all.push({ ...r, PlatformName: p })); // add platform
        }
        rows = all as any;
      }

      // --- Normalize fields (PlatformName → Platform, etc.) ---
      this.relatedCourses = (rows || []).map((r: any) => ({
        ...r,
        Platform: r.PlatformName ?? r.Platform ?? r.platformName ?? r.platform ?? '',
        Students: r.Students ?? r.Enrolled ?? r.enrolled ?? null,
        CourseId: r.CourseId ?? r.CourseID ?? r.id ?? '',
        CourseName: r.CourseName ?? r.title ?? '',
        Rating: r.Rating ?? r.rating ?? null
      }));

      this.cdr.detectChanges();
    } catch (err) {
      console.warn('[Compare Cloud] getCoursesByConcept*(…) failed:', err);
      this.relatedCourses = [];
    }
  }

  /** Legend (fixed order + registry colors) */
  get legendEntries(): Array<{ name: string; color: string }> {
    return this.legendOrder.map(name => ({
      name,
      color: this.colors.getColor(name)
    }));
  }

  /** stripe color (safe fallback) */
  getStripeColor(platform: string): string {
    return this.colors.getColor(platform) || '#E0E0E0';
  }

  // ====== TABLE / SORT / PAGINATION =======================================
  displayRating(c: Row): number {
    const raw = c.Rating;
    if (raw === null || raw === undefined) return 0;
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
    return Number.isFinite(n) && n > 0 ? n : 0;
  }

  truncate(s: string, n = 80): string {
    return s?.length > n ? s.slice(0, n - 1) + '…' : s;
  }

  toggleSort(key: SortKey) {
    if (this.sort === key) this.order = this.order === 'asc' ? 'desc' : 'asc';
    else { this.sort = key; this.order = 'desc'; }
    this.page = 1;
  }

  private cmp(a: Row, b: Row): number {
    if (this.sort === 'rating') {
      const ar = this.displayRating(a);
      const br = this.displayRating(b);
      if (ar !== br) return this.order === 'asc' ? ar - br : br - ar;
      return a.CourseName.localeCompare(b.CourseName);
    } else {
      const as = a.Students ?? -1;
      const bs = b.Students ?? -1;
      if (as !== bs) return this.order === 'asc' ? as - bs : bs - as;
      return a.CourseName.localeCompare(b.CourseName);
    }
  }

  get sortedCourses(): Row[] {
    if (!this.relatedCourses?.length) return [];
    return [...this.relatedCourses].sort((x, y) => this.cmp(x, y));
  }

  get pagedCourses(): Row[] {
    const start = (this.page - 1) * this.pageSize;
    return this.sortedCourses.slice(start, start + this.pageSize);
  }

  onPageSizeChange(v: string) {
    const n = Math.max(5, Math.min(50, parseInt(v || '10', 10)));
    if (n !== this.pageSize) {
      this.pageSize = n;
      this.page = 1;
    }
  }
  prevPage() { if (this.page > 1) this.page--; }
  nextPage() { if (this.page < this.pageCount) this.page++; }

  onCourseClick(courseId: string) {
    if (!courseId) return;
    window.open(`/course-detail/${encodeURIComponent(String(courseId))}`, '_blank', 'noopener');
  }
}
