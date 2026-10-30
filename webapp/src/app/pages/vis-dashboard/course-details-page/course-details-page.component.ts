import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { combineLatest, map, Observable } from 'rxjs';
import {
  Concept,
  VisDashboardService,
} from '../../../services/vis-dashboard/vis-dashboard.service';
import { Course } from '../../../services/vis-dashboard/vis-dashboard.service';
import { FavouriteRecommendationsService } from 'src/app/services/rec-dashboard/favourite-recommendations.service';
import { MoocRecommendationsService } from 'src/app/services/rec-dashboard/mooc-recommendations.service';
import { CourseRecommendation } from 'src/app/models/CourseRecommendation';

@Component({
  selector: 'app-course-details-page',
  templateUrl: './course-details-page.component.html',
  styleUrls: ['./course-details-page.component.css'],
})
export class CourseDetailsPageComponent implements OnInit {
  courseId: string;
  course: Course[];
  concepts: Concept[];
  words: string[];
  data: { text: string; value: number }[] = [{ text: 'me', value: 6 }];
  myData: { text: string; value: number }[];

  // Get reommendation if this course is in the recommended MOOCs list, otherwise null
  readonly matchingRecommendation$: Observable<CourseRecommendation | null> =
    combineLatest([
      this.route.paramMap,
      this.moocRecommendationService.recommendations$,
    ]).pipe(
      map(([params, recommendations]) => {
        const courseId = params.get('id');
        return (
          recommendations.find(
            (recommendation) => recommendation.course_id === courseId,
          ) ?? null
        );
      }),
    );

  // Based on the recommendation score, set the background color of the score display
  scoreBackgroundColor: string = 'transparent';

  constructor(
    private route: ActivatedRoute,
    private visDashboardService: VisDashboardService,
    private favouriteRecommendationsService: FavouriteRecommendationsService,
    private moocRecommendationService: MoocRecommendationsService,
  ) {}

  ngOnInit(): void {
    // make sure recommendations are loaded before checking if this course is favourited
    this.favouriteRecommendationsService
      .getFavouriteRecommendations()
      .subscribe();

    // Get recommended MOOCs to lookup courseID for favouriting
    this.moocRecommendationService.getRecommendedMOOCs().subscribe();

    this.courseId = this.route.snapshot.paramMap.get('id');

    this.getCourseDetails();
    this.getCourseConcepts(this.courseId);
  }

  getCourseDetails() {
    this.visDashboardService.getCourseById(this.courseId).then((course) => {
      this.course = course;
    });
  }

  getCourseConcepts(courseId: string) {
    this.visDashboardService.getConceptsByCourseId(courseId).then((concept) => {
      this.concepts = concept;
      this.words = this.concepts.map((c) => c.ConceptName);
      this.myData = this.words.map(function (d) {
        return { text: d, value: 10 + Math.random() * 90 };
      });
      this.data = this.myData;
    });
  }

  onWorkClick($event: any) {}

  getScoreBackgroundColor(score: number): string {
    if (score >= 80) {
      return 'green';
    } else if (score >= 50) {
      return 'yellow';
    } else {
      return 'red';
    }
  }
}
