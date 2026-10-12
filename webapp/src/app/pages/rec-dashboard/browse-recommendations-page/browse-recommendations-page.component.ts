import { Component } from '@angular/core';
import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  take,
} from 'rxjs';
import { CourseRecommendation } from 'src/app/models/CourseRecommendation';
import { MoocRecommendationsService } from 'src/app/services/rec-dashboard/mooc-recommendations.service';

type SortBy = 'relevant' | 'rated' | 'A to Z' | 'Z to A';
const UNCATEGORIZED = 'Uncategorized';

export const PLATFORM_BACKGROUND_COLOURS: Record<string, string> = {
  'on Campus': '#F7DF05',
  'KI Campus': '#6A05F7',
  OpenVhb: '#00A3FF',
  EdX: '#00B8A9',
  OpenHPI: '#FF6B00',
  Coursera: '#0056D2',
  CourseMapper: '#00A86B',
  IMoox: '#F0007A',
  Udemy: '#FF3B30',
  Udacity: '#A3E635',
  'Future Learn': '#c019dd'
};

type MoocProperties = Extract<
  CourseRecommendation['node_properties'],
  { rating: string }
>;

// available platforms = [ 'On Campus', 'KI Campus', 'OpenVhb', 'EdX', 'OpenHPI','Coursera','CourseMapper','IMoox','Udemy','Udacity']

interface FilterState {
  platforms: string[];
  categories: string[];
  maxPrice: number;
  duration: string[];
}

// check if node properties are of MOOCentral courses
export function isMoocProperties(
  properties: CourseRecommendation['node_properties'],
): properties is MoocProperties {
  return 'rating' in properties;
}

function getCategory(recommendation: CourseRecommendation): string {
  if (!isMoocProperties(recommendation.node_properties)) {
    return UNCATEGORIZED;
  }

  const category = recommendation.node_properties.course_category;
  return category && category !== 'Course_category information not available'
    ? category
    : UNCATEGORIZED;
}

function getPlatformNames(recommendation: CourseRecommendation): string[] {
  const platforms =
    recommendation.platforms?.map((platform) => platform.name) ?? [];

  if (recommendation.source === 'CourseMapper') {
    platforms.push('CourseMapper');
  }

  return [...new Set(platforms)];
}

function parseDuration(duration) {
  const match = duration.match(/\d+(\.\d+)?/);

  const value = match ? parseFloat(match[0]) : null;

  if (/hour|hr/i.test(duration)) {
    return {
      value,
      unit: 'hours',
    };
  }

  if (/week|wk/i.test(duration)) {
    console.log(value);
    return {
      value,
      unit: 'weeks',
    };
  }

  if (/month/i.test(duration)) {
    return {
      value,
      unit: 'months',
    };
  }

  return {
    value: null,
    unit: 'unknown',
  };
}

function getDurationCategory(rec: CourseRecommendation) {
  if (!isMoocProperties(rec.node_properties)) {
    return 'Not given';
  }
  const { value, unit } = parseDuration(rec.node_properties.duration);

  if (value === null) {
    return 'Not given';
  }

  if (unit === 'hours') {
    if (value < 2) {
      return 'lessThan2Hours';
    }

    if (value <= 10) {
      return '2To10Hours';
    }

    if (value <= 20) {
      return '10To20Hours';
    }

    return 'moreThan20Hours';
  }

  if (unit === 'weeks') {
    if (value <= 4) {
      return '1To4Weeks';
    }

    return 'moreThan4Weeks';
  }

  if (unit === 'months') {
    if (value <= 3) {
      return '1To3Months';
    }

    if (value <= 6) {
      return '3To6Months';
    }

    return 'moreThan6Months';
  }

  if (unit === 'years') {
    return 'moreThan6Months';
  }

  return 'Not given';
}

function parsePrice(price) {
  if (!price) {
    return null;
  }

  const value = parseFloat(price.replace('€', '').trim());

  return isNaN(value) ? null : value;
}

function getPrice(rec: CourseRecommendation) {
  if (!isMoocProperties(rec.node_properties)) {
    return null;
  }

  return parsePrice(rec.node_properties.price);
}

@Component({
  selector: 'app-browse-recommendations-page',
  templateUrl: './browse-recommendations-page.component.html',
  styleUrls: ['./browse-recommendations-page.component.css'],
})
export class BrowseRecommendationsPageComponent {
  overviewPlacement: 'left' | 'right' = 'right';

  readonly loading$ = this.moocRecommendationService.loading$;
  readonly error$ = this.moocRecommendationService.error$;

  readonly platformBackgroundColours = PLATFORM_BACKGROUND_COLOURS;

  readonly recommendations$ =
    this.moocRecommendationService.recommendation$.pipe(
      map((items) =>
        this.moocRecommendationService.normalizeRecommendations(items),
      ),
    );

  // Filtering information
  readonly availablePlatforms$: Observable<string[]> =
    this.moocRecommendationService.recommendation$.pipe(
      map((items) => {
        const platforms = items.flatMap(getPlatformNames);

        return [...new Set(platforms)];
      }),
    );

  readonly availableCategories$: Observable<string[]> =
    this.moocRecommendationService.recommendation$.pipe(
      map((items) => {
        const categories = items.flatMap((item) => {
          return [getCategory(item)];
        });

        return [...new Set(categories)];
      }),
    );

  readonly maxAvailablePrice$: Observable<number> =
    this.moocRecommendationService.recommendation$.pipe(
      map((items) => {
        const prices = items
          .flatMap((item) => {
            return [getPrice(item)];
          })
          .filter((price) => price !== null);

        return Math.round(Math.max(...prices));
      }),
    );

  // filter counts
  readonly platformCounts$: Observable<Record<string, number>> =
    this.recommendations$.pipe(
      map((items) =>
        items.reduce(
          (counts, item) => {
            getPlatformNames(item).forEach((platform) => {
              counts[platform] = (counts[platform] ?? 0) + 1;
            });
            return counts;
          },
          {} as Record<string, number>,
        ),
      ),
    );

  readonly categoryCounts$: Observable<Record<string, number>> =
    this.recommendations$.pipe(
      map((items) =>
        items.reduce(
          (counts, item) => {
            const category = getCategory(item);
            counts[category] = (counts[category] ?? 0) + 1;
            return counts;
          },
          {} as Record<string, number>,
        ),
      ),
    );

  readonly durationCounts$: Observable<Record<string, number>> =
    this.recommendations$.pipe(
      map((items) =>
        items.reduce(
          (counts, item) => {
            const duration = getDurationCategory(item);
            counts[duration] = (counts[duration] ?? 0) + 1;
            return counts;
          },
          {} as Record<string, number>,
        ),
      ),
    );

  durationOptions = [
    { label: 'Less than 2 hours', value: 'lessThan2Hours' },
    { label: '2-10 hours', value: '2To10Hours' },
    { label: '10-20 hours', value: '10To20Hours' },
    { label: '20+ hours', value: 'moreThan20Hours' },
    { label: '1-4 weeks', value: '1To4Weeks' },
    { label: 'More than 4 weeks', value: 'moreThan4Weeks' },
    { label: '1-3 months', value: '1To3Months' },
    { label: '3-6 months', value: '3To6Months' },
    { label: 'More than 6 months', value: 'moreThan6Months' },
    { label: 'Not given', value: 'Not given' },
  ];

  filterState$ = new BehaviorSubject<FilterState>({
    platforms: [],
    categories: [],
    maxPrice: 0,
    duration: [...this.durationOptions.map((d) => d.value)],
  });

  // Sorting Information
  private readonly sortBySubject = new BehaviorSubject<SortBy>('relevant');
  readonly sortBy$ = this.sortBySubject.asObservable();

  readonly displayedRecommendations$ = combineLatest([
    this.recommendations$,
    this.sortBy$,
    this.filterState$,
  ]).pipe(
    map(([recommendations, sortBy, filters]) => {
      console.log(filters);
      const filteredRecommendations = recommendations.filter((rec) => {
        const matchesPlatforms =
          filters.platforms.length === 0 ||
          getPlatformNames(rec).some((platform) =>
            filters.platforms.includes(platform),
          );

        const matchesCategory = filters.categories.includes(getCategory(rec));

        const matchesDuration = filters.duration.includes(
          getDurationCategory(rec),
        );

        const matchesPrice =
          isMoocProperties(rec.node_properties) &&
          getPrice(rec) <= filters.maxPrice;

        return (
          matchesPlatforms && matchesCategory && matchesDuration && matchesPrice
        );
      });

      return this.sortRecommendations(filteredRecommendations, sortBy);
    }),
  );

  constructor(private moocRecommendationService: MoocRecommendationsService) {}

  ngOnInit() {
    this.moocRecommendationService.getRecommendedMOOCs().subscribe();

    this.availablePlatforms$
      .pipe(
        filter((platforms) => platforms.length > 0),
        take(1),
      )
      .subscribe((platforms) => {
        const current = this.filterState$.value;
        this.filterState$.next({
          ...current,
          platforms: platforms, // Sets the state array to contain ALL available platforms in the generated recommendations on init
        });
      });

    this.availableCategories$
      .pipe(
        filter((categories) => categories.length > 0),
        take(1),
      )
      .subscribe((categories) => {
        const current = this.filterState$.value;
        this.filterState$.next({
          ...current,
          categories: categories, // Sets the state array to contain ALL available categories in the generated recommendations on init
        });
      });

    this.maxAvailablePrice$
      .pipe(
        filter((price) => Number.isFinite(price)),
        take(1),
      )
      .subscribe((price) => {
        const current = this.filterState$.value;
        this.filterState$.next({
          ...current,
          maxPrice: price,
        });
      });
  }

  setSortBy(sortBy: SortBy) {
    this.sortBySubject.next(sortBy);
  }

  // Get card position to calculate hover overview placement
  setOverviewPlacement(event: MouseEvent) {
    const card = event.currentTarget as HTMLElement;
    const bounds = card.getBoundingClientRect();
    const spaceOnRight = window.innerWidth - bounds.right;
    const spaceOnLeft = bounds.left;

    this.overviewPlacement =
      spaceOnRight >= 320 || spaceOnRight >= spaceOnLeft ? 'right' : 'left';
  }

  private sortRecommendations(
    recommendations: CourseRecommendation[],
    sortBy: SortBy,
  ): CourseRecommendation[] {
    const sortedRecommendations = [...recommendations];

    switch (sortBy) {
      case 'relevant':
        // Implement relevant sorting logic
        break;

      case 'rated':
        sortedRecommendations.sort((a, b) => {
          const propertiesA = a.node_properties;
          const propertiesB = b.node_properties;

          if (
            !isMoocProperties(propertiesA) ||
            !isMoocProperties(propertiesB)
          ) {
            return 0;
          }
          const ratingA = Number(propertiesA.rating);
          const ratingB = Number(propertiesB.rating);

          const validA = Number.isFinite(ratingA);
          const validB = Number.isFinite(ratingB);

          if (!validA && !validB) return 0;
          if (!validA) return 1;
          if (!validB) return -1;

          return ratingB - ratingA;
        });
        break;

      case 'A to Z':
        sortedRecommendations.sort((a, b) => a.name.localeCompare(b.name));
        break;

      case 'Z to A':
        sortedRecommendations.sort((a, b) => b.name.localeCompare(a.name));
        break;

      default:
        return recommendations;
    }

    return sortedRecommendations;
  }

  onTogglePlatform(platformName: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const current = this.filterState$.value;
    const updatedPlatforms = isChecked
      ? [...current.platforms, platformName]
      : current.platforms.filter((p) => p !== platformName);

    this.filterState$.next({ ...current, platforms: updatedPlatforms });
  }

  onToggleCategory(category: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const current = this.filterState$.value;
    const updatedCategories = isChecked
      ? [...current.categories, category]
      : current.categories.filter((c) => c != category);

    this.filterState$.next({ ...current, categories: updatedCategories });
  }

  onToggleDuration(duration: string, event: Event) {
    const isChecked = (event.target as HTMLInputElement).checked;
    const current = this.filterState$.value;
    const updatedDuration = isChecked
      ? [...current.duration, duration]
      : current.duration.filter((d) => d != duration);

    this.filterState$.next({ ...current, duration: updatedDuration });
  }

  onChangeMaxPrice(price: number) {
    const current = this.filterState$.value;
    this.filterState$.next({ ...current, maxPrice: price });
  }
}
