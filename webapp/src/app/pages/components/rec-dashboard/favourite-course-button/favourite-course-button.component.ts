import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { finalize, Subscription } from 'rxjs';
import { CourseRecommendation } from 'src/app/models/CourseRecommendation';
import { FavouriteRecommendationsService } from 'src/app/services/rec-dashboard/favourite-recommendations.service';

@Component({
  selector: 'app-favourite-course-button',
  templateUrl: './favourite-course-button.component.html',
  styleUrls: ['./favourite-course-button.component.css'],
})
export class FavouriteCourseButtonComponent implements OnInit, OnDestroy {
  @Input() course: CourseRecommendation;
  favouriteRecommendations$ = this.favouriteRecommendationsService.favourites$;
  favourited: boolean = false;
  pending = false; // disable button while request is in progress

  // Subscribe to the favourites$ observable to update the favourited state when the list of favourites changes
  private favouritesSubscription?: Subscription;

  constructor(private favouriteRecommendationsService: FavouriteRecommendationsService) {}

  ngOnInit() {
    const courseId = this.course.course_id;
    const source = this.course.source;

    this.favouritesSubscription = this.favouriteRecommendations$.subscribe((favourites) => {
      this.favourited = favourites.some(
        (favourite) => favourite.courseId === courseId && favourite.source === source,
      );
    });
  }

  ngOnDestroy() {
    this.favouritesSubscription?.unsubscribe();
  }

  toggleFavourite(event: Event) {
    // Prevent the click event from propagating to the parent element (e.g., the course card)
    event.stopPropagation();

    // Prevent multiple requests if one is already in progress
    if (this.pending) return;

    const courseId = this.course.course_id;
    const source = this.course.source;
    const name = this.course.name;

    const teachers = this.course.teachers ?? [];
    const teacher = teachers.length > 1
      ? `${teachers[0].name} et al.` // If there are multiple teachers, display the first one followed by "et al."
      : teachers[0]?.name ?? 'Unknown instructor';
    this.pending = true;

    const request$ = this.favourited
      ? this.favouriteRecommendationsService.removeFavouriteRecommendation(
          courseId,
          source,
          name,
        )
      : this.favouriteRecommendationsService.addFavouriteRecommendation(
          courseId,
          source,
          name,
          teacher,
        );

    request$
      .pipe(finalize(() => (this.pending = false)))
      .subscribe();
  }
}
