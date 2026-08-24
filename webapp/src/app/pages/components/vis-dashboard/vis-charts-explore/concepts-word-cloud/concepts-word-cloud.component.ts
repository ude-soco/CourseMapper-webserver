/*import { Component, OnInit, ChangeDetectorRef } from '@angular/core'; //import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from "@angular/router";
import {
  Concept,
  CourseByPlatformAndConcept,
  VisDashboardService
} from "../../../../../services/vis-dashboard/vis-dashboard.service";
import {usePopularWords} from "../../../../../utils/usePopularWords";


/*interface Word {
  text: string,
  value: number,
  font: string,
  style: string,
  weight: string,
}/
interface Word {
  text: string;
  size: number;        // <- required by the lib
  value?: number;      // optional, keep if you like
  font?: string;
  style?: string;
  weight?: string;
}

@Component({
  selector: 'app-concepts-word-cloud',
  templateUrl: './concepts-word-cloud.component.html',
  styleUrls: ['./concepts-word-cloud.component.css']
})
export class ConceptsWordCloudComponent implements OnInit {
  platform: string
  concepts: Concept[]
  data: Word[] = []; //data: { text: string; value: number }[] = [];   // <-- size, not value data: { text: string; value: number; }[] = [{"text": "test", value: 0}]
  words: string[]
  selectedTopic: string
  relatedCourses: CourseByPlatformAndConcept[] = []
  topicClicked: boolean = false
  isCloudLoading: boolean = true

  // NEW: sorting state
  sortDir: 'asc' | 'desc' = 'asc';

  // NEW: stable trackBy to stop Angular warning and keep scrolling position
  trackCourse = (_: number, c: CourseByPlatformAndConcept) => c.CourseId;


  constructor(private route: ActivatedRoute,
              private visDashboardService: VisDashboardService,
              private router: Router,
              private cdr: ChangeDetectorRef) { //this is newly added
  }

  ngOnInit(): void {
    this.platform = this.route.snapshot.paramMap.get('platform');
    this.getConceptsByPlatform(this.platform.toLowerCase());
  }


  /*getConceptsByPlatform(platform: string) {
    this.isCloudLoading = true
    this.visDashboardService.getConceptsByPlatform(platform)
      .then((concepts) => {
        this.concepts = concepts
        this.words = this.concepts.map(c => c.ConceptName)
        const {data} = usePopularWords(this.words)
        this.data = data.map(d => ({ text: d.text, size: d.value })); //this.data = data
        this.isCloudLoading = false
      })

  }/
  

  getConceptsByPlatform(platform: string) {
    this.isCloudLoading = true;

    this.visDashboardService.getConceptsByPlatform(platform)
      .then(concepts => {
        const rows = (concepts || []).filter(c => c?.ConceptName && Number(c.Count) > 0);

        const counts = rows.map(r => Number(r.Count));
        const min = Math.min(...counts);
        const max = Math.max(...counts);
        const scale = (n: number) => {
          if (max === min) return 30;                 // avoid division by zero
          return 12 + ((n - min) / (max - min)) * 36; // -> [12, 48]
        };

        this.data = rows.map(r => {
          const s = scale(Number(r.Count));
          return { text: r.ConceptName, size: s, value: s }; // size is the key
        });

        this.topicClicked = false;
        this.cdr.detectChanges();
        console.log('cloud words:', this.data.length, this.data.slice(0, 5));
      })
      .catch(err => { console.error(err); this.data = []; })
      .finally(() => this.isCloudLoading = false);
  }






  // Get courses by platform and concepts
  getCoursesByPlatformAndConcepts(platform: string, concept: string) {
    this.visDashboardService.getCoursesByConceptAndPlatform(platform, concept)
      .then((courses) => {
        this.relatedCourses = courses
      })
  }
  getCoursesByPlatformAndConcepts(platform: string, concept: string) {
    this.visDashboardService.getCoursesByConceptAndPlatform(platform, concept)
      .then((courses) => {
        console.log('courses-for-explore response (unsorted):', courses);

        // Sort by Rank ascending (or descending depending on use case)
        this.relatedCourses = [...courses].sort((a, b) => a.Rank - b.Rank);

        console.log('sorted courses:', this.relatedCourses);
        this.cdr.detectChanges();
      });
  }/
   getCoursesByPlatformAndConcepts(platform: string, concept: string) {
    this.visDashboardService.getCoursesByConceptAndPlatform(platform, concept)
      .then(courses => {
        // keep raw list, but normalize Rank so sorting is stable
        this.relatedCourses = (courses || []).map(c => ({
          ...c,
          Rank: typeof c.Rank === 'number' ? c.Rank : 999999
        }));
        this.cdr.detectChanges();
      });
  }



  /*onWorkClick(eventData: { event: MouseEvent; word: Word }) {
    this.selectedTopic = eventData.word.text
    this.getCoursesByPlatformAndConcepts(this.platform.toLowerCase(), this.selectedTopic)
    this.topicClicked = true
  }/
  onWorkClick(e: { event: MouseEvent; word: { text: string } }) {
    this.selectedTopic = e.word.text;
    this.getCoursesByPlatformAndConcepts(this.platform.toLowerCase(), this.selectedTopic);
    this.topicClicked = true;
  }


  onCourseClick(CourseId: string) {
    this.router.navigate(['course-detail', CourseId])
  }

  // NEW: toggle & computed sorted list
    toggleSort(dir: 'asc' | 'desc') {
    this.sortDir = dir;
  }
    // Compare with rank, fallback to name for ties
  private compareCourses(a: CourseByPlatformAndConcept, b: CourseByPlatformAndConcept): number {
  const ar = Number(a.Rank ?? 999999);
  const br = Number(b.Rank ?? 999999);
  if (ar === br) return a.CourseName.localeCompare(b.CourseName);
  return this.sortDir === 'asc' ? ar - br : br - ar;
}

get sortedCourses(): CourseByPlatformAndConcept[] {
  return [...this.relatedCourses].sort((a, b) => this.compareCourses(a, b));
}

}*/
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import {
  Concept,
  CourseByPlatformAndConcept,
  VisDashboardService
} from '../../../../../services/vis-dashboard/vis-dashboard.service';

/** d3-cloud expects `size` */
interface Word {
  text: string;
  size: number;
  value?: number;
  font?: string;
  style?: string;
  weight?: string;
}

/** allow Rating/rating from API */
type CourseWithRating = CourseByPlatformAndConcept & {
  Rating?: number | string;
  rating?: number | string;
  Rank?: number | string; // keep old field harmlessly
};

@Component({
  selector: 'app-concepts-word-cloud',
  templateUrl: './concepts-word-cloud.component.html',
  styleUrls: ['./concepts-word-cloud.component.css']
})
export class ConceptsWordCloudComponent implements OnInit {
  platform: string;
  concepts: Concept[] = [];
  data: Word[] = [];

  selectedTopic = '';
  relatedCourses: CourseWithRating[] = [];

  topicClicked = false;
  isCloudLoading = true;

  /** default sort: high → low */
  sortDir: 'asc' | 'desc' = 'desc';

  trackCourse = (_: number, c: CourseWithRating) => c.CourseId;

  constructor(
    private route: ActivatedRoute,
    private visDashboardService: VisDashboardService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.platform = this.route.snapshot.paramMap.get('platform') || '';
    this.getConceptsByPlatform(this.platform.toLowerCase());
  }

  /** ---------- Cloud ---------- */
  getConceptsByPlatform(platform: string) {
    this.isCloudLoading = true;
    this.visDashboardService.getConceptsByPlatform(platform)
      .then(concepts => {
        const rows = (concepts || []).filter(r => r?.ConceptName);
        // scale sizes
        const counts = rows.map(r => Number(r.Count || 1));
        const min = Math.min(...counts);
        const max = Math.max(...counts);
        const scale = (n: number) => (max === min ? 30 : 12 + ((n - min) / (max - min)) * 36);

        this.data = rows.map(r => {
          const s = scale(Number(r.Count || 1));
          return { text: r.ConceptName, size: s, value: s };
        });

        this.topicClicked = false;
        this.cdr.detectChanges();
      })
      .catch(err => { console.error(err); this.data = []; })
      .finally(() => this.isCloudLoading = false);
  }

  /** ---------- Courses for a topic ---------- */
  getCoursesByPlatformAndConcepts(platform: string, concept: string) {
    this.visDashboardService.getCoursesByConceptAndPlatform(platform, concept)
      .then(courses => {
        this.relatedCourses = (courses || []) as CourseWithRating[];
        this.cdr.detectChanges();
      });
  }

  onWorkClick(e: { event: MouseEvent; word: { text: string } }) {
    this.selectedTopic = e.word.text;
    this.getCoursesByPlatformAndConcepts(this.platform.toLowerCase(), this.selectedTopic);
    this.topicClicked = true;
  }

  /** open course details in a NEW tab */
  onCourseClick(courseId: string) {
    window.open(`/course-detail/${courseId}`, '_blank');
  }

  toggleSort(dir: 'asc' | 'desc') { this.sortDir = dir; }

  /** ---------- Helpers ---------- */

  /** rating shown in the list; default to 0 if missing/invalid */
 displayRating(c: CourseWithRating): number {
  const raw = c.Rating ?? c.rating ?? c.Rank;
    if (raw === null || raw === undefined) return 0;
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(',', '.'));
    // clamp invalid or negative values to 0
    return Number.isFinite(n) && n > 0 ? n : 0;
  }


  private compare(a: CourseWithRating, b: CourseWithRating): number {
    const ar = this.displayRating(a);
    const br = this.displayRating(b);
    if (ar !== br) return this.sortDir === 'asc' ? ar - br : br - ar;
    return a.CourseName.localeCompare(b.CourseName);
  }

  get sortedCourses(): CourseWithRating[] {
    return [...this.relatedCourses].sort((x, y) => this.compare(x, y));
  }
}




