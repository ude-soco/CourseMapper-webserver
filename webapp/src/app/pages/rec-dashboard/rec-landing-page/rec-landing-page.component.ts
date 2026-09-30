import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { MoocRecommendationsService } from 'src/app/services/rec-dashboard/mooc-recommendations.service';

@Component({
  selector: 'app-rec-landing-page',
  templateUrl: './rec-landing-page.component.html',
  styleUrls: ['./rec-landing-page.component.css']
})
export class RecLandingPageComponent implements OnInit {
  readonly loading$ = this.moocRecommendationService.loading$;
  readonly error$ = this.moocRecommendationService.error$;
  readonly recommendations$ = this.moocRecommendationService.recommendation$.pipe(
    map((items) => this.moocRecommendationService.normalizeRecommendations(items)),
  );

  constructor(private moocRecommendationService: MoocRecommendationsService) {}

  ngOnInit() {
    this.moocRecommendationService.getRecommendedMOOCs().subscribe();
  }
}
