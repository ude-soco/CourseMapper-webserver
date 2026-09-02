import { Component, OnInit } from '@angular/core';
import { CourseRecommendation } from 'src/app/models/CourseRecommendation';
import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';

@Component({
  selector: 'app-rec-landing-page',
  templateUrl: './rec-landing-page.component.html',
  styleUrls: ['./rec-landing-page.component.css']
})
export class RecLandingPageComponent implements OnInit {
  recommendations: CourseRecommendation[] = [];
  loading = false;
  error = '';

  constructor(private recommendationService: MaterialsRecommenderService) {}

  ngOnInit() {
    this.getRecommendations();
  }

  getRecommendations() {
    this.loading = true;
    this.error = '';

    this.recommendationService.getRecommendedMOOCs({}).subscribe({
      next: (result) => {
        this.recommendations = result;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to fetch recommendations.';
        this.loading = false;
      }
    })
  }

}
