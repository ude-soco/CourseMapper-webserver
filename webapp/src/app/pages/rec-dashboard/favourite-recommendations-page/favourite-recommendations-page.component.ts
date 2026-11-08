import { Component, OnInit } from '@angular/core';
import { RecommendationSource } from 'src/app/models/FavouriteRecommendation';
import { FavouriteRecommendationsService } from 'src/app/services/rec-dashboard/favourite-recommendations.service';
import { BehaviorSubject, combineLatest, map } from 'rxjs';

type FavouriteSortOption = 'dateAddedAscending' | 'dateAddedDescending' | 'nameAscending' | 'nameDescending';

` 
Actual favouriting logic is handled in the FavouriteCourseButtonComponent, 
this page just displays the list of favourited courses
`

@Component({
  selector: 'app-favourite-recommendations-page',
  templateUrl: './favourite-recommendations-page.component.html',
  styleUrls: ['./favourite-recommendations-page.component.css'],
})
export class FavouriteRecommendationsPageComponent implements OnInit {
  selectedSortOption: FavouriteSortOption = 'dateAddedAscending';

  // Options for sorting the favourite recommendations
  sortOptions = [
    { label: 'Most Recent', value: 'dateAddedAscending' as FavouriteSortOption },
    { label: 'Oldest', value: 'dateAddedDescending' as FavouriteSortOption },
    { label: 'Ascending: A to Z', value: 'nameAscending' as FavouriteSortOption },
    { label: 'Descending: Z to A', value: 'nameDescending' as FavouriteSortOption },
  ];

  private readonly sortOptionSubject = new BehaviorSubject<FavouriteSortOption>(
    this.selectedSortOption,
  );

  // Sort favourites based on the selected sort option
  favouriteRecommendations$ = combineLatest([
    this.favouriteRecommendationsService.favourites$,
    this.sortOptionSubject,
  ]).pipe(
    map(([favourites, sortOption]) =>
      [...favourites].sort((first, second) => {
        if (sortOption === 'dateAddedAscending') {
          return (
            new Date(second.addedAt).getTime() -
            new Date(first.addedAt).getTime()
          );
        } else if (sortOption === 'dateAddedDescending') {
          return (
            new Date(first.addedAt).getTime() -
            new Date(second.addedAt).getTime()
          );
        }

        const nameOrder = first.name.localeCompare(second.name);
        return sortOption === 'nameAscending' ? nameOrder : -nameOrder;
      }),
    ),
  );

  constructor(
    private favouriteRecommendationsService: FavouriteRecommendationsService,
  ) {}

  ngOnInit() {
    this.favouriteRecommendationsService
      .getFavouriteRecommendations()
      .subscribe();
  }

  onSortChange(sortOption: FavouriteSortOption) {
    this.sortOptionSubject.next(sortOption);
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
