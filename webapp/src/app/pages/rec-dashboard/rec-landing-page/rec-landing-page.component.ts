import { Component, OnInit } from '@angular/core';
import { map } from 'rxjs';
import { FavouriteRecommendationsService } from 'src/app/services/rec-dashboard/favourite-recommendations.service';
import { MoocRecommendationsService } from 'src/app/services/rec-dashboard/mooc-recommendations.service';
import { getCourseCarouselObject } from '../../components/rec-dashboard/recommendation-carousel/recommendation-carousel.component';

@Component({
  selector: 'app-rec-landing-page',
  templateUrl: './rec-landing-page.component.html',
  styleUrls: ['./rec-landing-page.component.css'],
})
export class RecLandingPageComponent implements OnInit {
  readonly loading$ = this.moocRecommendationService.loading$;
  readonly error$ = this.moocRecommendationService.error$;
  readonly recommendations$ =
    this.moocRecommendationService.recommendations$.pipe(
      map((items) =>
        this.moocRecommendationService.normalizeRecommendations(items),
      ),
    );

  readonly favouriteRecommendations$ = this.favouriteRecommendationsService.favourites$;
  getCourseCarouselObject = getCourseCarouselObject;

  constructor(
    private moocRecommendationService: MoocRecommendationsService,
    private favouriteRecommendationsService: FavouriteRecommendationsService,
  ) {}

  ngOnInit() {
    this.moocRecommendationService.getRecommendedMOOCs().subscribe();
    this.favouriteRecommendationsService.getFavouriteRecommendations().subscribe();
  }
}
