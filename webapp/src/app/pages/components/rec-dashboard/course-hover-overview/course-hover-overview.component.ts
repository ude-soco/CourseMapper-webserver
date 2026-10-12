import { PLATFORM_BACKGROUND_COLOURS, isMoocProperties } from './../../../rec-dashboard/browse-recommendations-page/browse-recommendations-page.component';
import { CourseRecommendation } from './../../../../models/CourseRecommendation';
import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-course-hover-overview',
  templateUrl: './course-hover-overview.component.html',
  styleUrls: ['./course-hover-overview.component.css']
})
export class CourseHoverOverviewComponent {
  @Input() rec: CourseRecommendation;
  @Input() placement: 'left' | 'right' = 'right';

  readonly platformBackgroundColours = PLATFORM_BACKGROUND_COLOURS;
  readonly isMoocProperties = isMoocProperties;
}
