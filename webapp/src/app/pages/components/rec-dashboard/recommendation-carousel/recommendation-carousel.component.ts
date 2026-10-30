import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CourseRecommendation } from 'src/app/models/CourseRecommendation';
import { FavouriteRecommendation } from 'src/app/models/FavouriteRecommendation';

export type CourseCarouselObject = {
  course_id: string;
  score: number;
  name: string;
  teacher: string;
};

export function getCourseCarouselObject(
  recommendations: CourseRecommendation[] | FavouriteRecommendation[],
): CourseCarouselObject[] {
  return recommendations.map((rec) => ({
    course_id: rec.course_id,
    score: rec.score,
    name: rec.name,
    teacher: rec.teacher || rec.teachers?.[0]?.name || 'Unknown instructor',
  }));
}

@Component({
  selector: 'app-recommendation-carousel',
  templateUrl: './recommendation-carousel.component.html',
  styleUrls: ['./recommendation-carousel.component.css'],
})
export class RecommendationCarouselComponent {
  @Input() carouselTitle: string = '';
  @Input() carouselItems: CourseCarouselObject[] = [];
  @Input() routerLink?: string;

  // Bind the template reference variable of scrollContainer to this property
  @ViewChild('scrollContainer', { read: ElementRef })
  scrollContainer!: ElementRef;

  scroll(direction: 'left' | 'right') {
    const container = this.scrollContainer.nativeElement;
    const scrollAmount = 220; // scroll distance

    if (direction === 'left') {
      container.scrollLeft -= scrollAmount; // Move left
    } else {
      container.scrollLeft += scrollAmount; // Move right
    }
  }
}
