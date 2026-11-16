import { Component, OnInit } from '@angular/core';
import { RecommendationSource } from 'src/app/models/FavouriteRecommendation';
import { FavouriteRecommendationsService } from 'src/app/services/rec-dashboard/favourite-recommendations.service';
import { BehaviorSubject, combineLatest, distinctUntilChanged, map } from 'rxjs';

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
  searchQuerySubject = new BehaviorSubject<string>('');

  // Observable for the search query, which emits the trimmed and lowercased query string
  private readonly searchQuery$ = this.searchQuerySubject.pipe(
  map((query) => query.trim().toLocaleLowerCase()),
  distinctUntilChanged(),
);

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

  // Sort and search favourites based on the selected sort option and search query
  favouriteRecommendations$ = combineLatest([
    this.favouriteRecommendationsService.favourites$,
    this.searchQuery$,
    this.sortOptionSubject,
  ]).pipe(
    map(([favourites, searchQuery, sortOption]) =>
      [...favourites]
        .filter((favourite) =>
          favourite.name.toLowerCase().includes(searchQuery)
        )
        .sort((first, second) => {
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

  searchQueryChange(query: string) {
    this.searchQuerySubject.next(query);
  }
}
