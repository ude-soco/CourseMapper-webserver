import { Component, Input } from '@angular/core';
import { CourseRecommendation } from 'src/app/models/CourseRecommendation';

@Component({
  selector: 'app-rec-of-the-day',
  templateUrl: './rec-of-the-day.component.html',
  styleUrls: ['./rec-of-the-day.component.css']
})
export class RecOfTheDayComponent {
  @Input() RecommendationOfTheDay: CourseRecommendation;
}
