import { Component } from '@angular/core';

@Component({
  selector: 'app-video-create-annotation',
  templateUrl: './video-create-annotation.component.html',
  styleUrls: ['./video-create-annotation.component.css']
})
export class VideoCreateAnnotationComponent {
  annotationColor: string = '#0000004D';
  rangeValues: number[];

}
