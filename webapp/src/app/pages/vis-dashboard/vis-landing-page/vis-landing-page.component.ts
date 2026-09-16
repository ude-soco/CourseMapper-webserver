import { CourseRecommendation } from './../../../models/CourseRecommendation';
import { Component, OnInit } from '@angular/core';
import { VisDashboardService } from '../../../services/vis-dashboard/vis-dashboard.service';
import { filterAndSelectCategories } from '../../../utils/FillterSelectCategories';
import { CourseCarouselType } from '../../components/vis-dashboard/carousel/course-carousel/course-carousel.component';
import { MoocRecommendationsService } from 'src/app/services/rec-dashboard/mooc-recommendations.service';

interface OptionsType {
  text: string;
  link: string;
}
@Component({
  selector: 'app-vis-landing-page',
  templateUrl: './vis-landing-page.component.html',
  styleUrls: ['./vis-landing-page.component.css'],
})
export class VisLandingPageComponent implements OnInit {
  protected readonly CourseCarouselType = CourseCarouselType;
  recommendations: CourseRecommendation[] = [];
  courseCategoryData: string[] = [];
  optionsData: OptionsType[] = [];
  
  constructor(
    private readonly visDashboardService: VisDashboardService,
    private moocRecommendationService: MoocRecommendationsService,
  ) {
    this.visDashboardService.getCourseCategories().then((courseCategories) => {
      this.courseCategoryData = filterAndSelectCategories(courseCategories);
    });
  }

  ngOnInit() {
    this.optionsData = [
      { text: 'Discover a MOOC/MOOC Insights', link: '/explore-moocs' },
      { text: 'Compare  MOOCs', link: '/compare-moocs' },
      { text: 'Find by Topics', link: '/find-moocs-by-topic' },
    ];

    this.visDashboardService
      .addLangaugesToPlatforms()
      .then(() => {})
      .catch((error) => {
        console.log(error);
      });

    this.moocRecommendationService.recommendation$.subscribe((items) => {
      this.recommendations =
        this.moocRecommendationService.normalizeRecommendations(items);
    });
    this.moocRecommendationService.getRecommendations();
  }
}
