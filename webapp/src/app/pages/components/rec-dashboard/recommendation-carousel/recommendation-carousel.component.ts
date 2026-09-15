import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { CourseRecommendation } from 'src/app/models/CourseRecommendation';

@Component({
  selector: 'app-recommendation-carousel',
  templateUrl: './recommendation-carousel.component.html',
  styleUrls: ['./recommendation-carousel.component.css']
})
export class RecommendationCarouselComponent {
  @Input() carouselTitle: string = '';
  @Input() carouselItems: CourseRecommendation[] = [];
  @Input() routerLink?: string;

  // Bind the template reference variable
  @ViewChild('scrollContainer', { read: ElementRef }) scrollContainer!: ElementRef;

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
