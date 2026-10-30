import { Component, OnInit } from '@angular/core';
import { RecommendationSource } from 'src/app/models/FavouriteRecommendation';
import { FavouriteRecommendationsService } from 'src/app/services/rec-dashboard/favourite-recommendations.service';

` 
Actual favouriting logic is handled in the FavouriteCourseButtonComponent, 
this page just displays the list of favourited courses
`;

@Component({
  selector: 'app-favourite-recommendations-page',
  templateUrl: './favourite-recommendations-page.component.html',
  styleUrls: ['./favourite-recommendations-page.component.css'],
})
export class FavouriteRecommendationsPageComponent implements OnInit {
  favouriteRecommendations$ = this.favouriteRecommendationsService.favourites$;

  constructor(
    private favouriteRecommendationsService: FavouriteRecommendationsService,
  ) {}

  ngOnInit() {
    this.favouriteRecommendationsService
      .getFavouriteRecommendations()
      .subscribe();
  }

  removeFavourite(
    courseId: string,
    source: RecommendationSource,
    name: string,
    event: Event,
  ) {
    event.stopPropagation(); // Prevent the click event from propagating to the parent element (e.g., the course card)
    this.favouriteRecommendationsService
      .removeFavouriteRecommendation(courseId, source, name)
      .subscribe();
  }
}
