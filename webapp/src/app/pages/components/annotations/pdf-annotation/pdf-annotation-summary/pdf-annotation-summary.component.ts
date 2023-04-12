import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Subscription } from 'rxjs';
import { computeElapsedTime, getInitials } from 'src/app/_helpers/format';
import { Annotation } from 'src/app/models/Annotations';
import { getAnnotationsForMaterial, State } from '../state/annotation.reducer';
import { createPopper } from '@popperjs/core';
import * as $ from 'jquery';

@Component({
  selector: 'app-pdf-annotation-summary',
  templateUrl: './pdf-annotation-summary.component.html',
  styleUrls: ['./pdf-annotation-summary.component.css'],
})
export class PdfAnnotationSummaryComponent implements OnInit, OnChanges {
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
      if (this.annotationId == null) return;
      else {
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

  showAnnotationPopOver(noteId: any, element: any) {
    if (noteId && element) {
      this.popover(element);
    }
  }

  getStyle() {
    if (this.isVisible) {
      return 'block';
    } else {
      return 'none';
    }
  }

  scrollToDiscussion(): void {
    this.isVisible = false;
    window.location.hash = '#annotation-' + this.selectedAnnotation._id;
    setTimeout(function () {
      $( window.location.hash).css('box-shadow','0 0 25px rgba(83, 83, 255, 1)')
      setTimeout(function () {
        $( window.location.hash).css('box-shadow', 'none')
          
      }, 2000);
    }, 100);
  }

  cancel(): void {
    this.isVisible = false;
    this.annotationId = null;
  }

  popover(element: any): void {
    this.isVisible = true;
    const popper = document.querySelector('.js-popover') as HTMLElement;
    if (popper) {
      createPopper(element, popper, {
        placement: 'bottom',
      });
    }
  }
}
