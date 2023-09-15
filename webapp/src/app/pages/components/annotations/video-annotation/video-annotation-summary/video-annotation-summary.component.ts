import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { createPopper } from '@popperjs/core';
import { Annotation } from 'src/app/models/Annotations';
import { getInitials, computeElapsedTime } from 'src/app/_helpers/format';
import { getAnnotationsForMaterial } from '../../pdf-annotation/state/annotation.reducer';
import { State } from '../state/video.reducer';
import * as $ from 'jquery';

@Component({
  selector: 'app-video-annotation-summary',
  templateUrl: './video-annotation-summary.component.html',
  styleUrls: ['./video-annotation-summary.component.css'],
})
export class VideoAnnotationSummaryComponent implements OnInit, OnChanges {
  @Input() annotationId!: any;
  selectedAnnotation: Annotation;
  annotationInitials?: string;
  annotationElapsedTime?: string;
  summary?: string;
  isVisible = false;

  constructor(private store: Store<State>) {}

  ngOnInit(): void {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('annotationId' in changes) {
      if (this.annotationId == null) {
        this.cancel();
        return;
      } else {
        this.store
          .select(getAnnotationsForMaterial)
          .subscribe((annotations) => {
            this.selectedAnnotation = annotations.find(
              (anno) => anno._id == this.annotationId
            );
          });
        const content = this.selectedAnnotation?.content.replace(
          /<\/?[^>]+(>|$)/g,
          ''
        );
        this.summary =
          content?.length > 100 ? content.slice(0, 97) + '...' : content;
        this.annotationInitials = getInitials(
          this.selectedAnnotation?.author?.name
        );
        this.annotationElapsedTime = computeElapsedTime(
          this.selectedAnnotation?.createdAt
        );
      }
    }
  }

  scrollToDiscussion() {
    this.isVisible = false;
    const elementToScrollTo = document.getElementById(
      `annotation-${this.selectedAnnotation._id}`
    );
    // Scroll to the element
    elementToScrollTo.scrollIntoView();
    window.location.hash = '#annotation-' + this.selectedAnnotation._id;
    setTimeout(function () {
      $(window.location.hash).css(
        'box-shadow',
        '0 0 25px rgba(83, 83, 255, 1)'
      );
      setTimeout(function () {
        $(window.location.hash).css('box-shadow', 'none');
      }, 2000);
    }, 100);
  }

  cancel() {
    this.isVisible = false;
    this.annotationId = null;
  }

  getStyle() {
    if (this.isVisible) {
      return 'block';
    } else {
      return 'none';
    }
  }
}
