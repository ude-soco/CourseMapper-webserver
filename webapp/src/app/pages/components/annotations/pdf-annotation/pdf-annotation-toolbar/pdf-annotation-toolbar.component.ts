import {
  Component,
  EventEmitter,
  OnChanges,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import {
  getHideAnnotationValue,
  getSelectedTool,
  State,
  getPdfZoom,
} from '../state/annotation.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import { PdfToolType } from 'src/app/models/Annotations';
import { getCurrentMaterialId } from '../../../materials/state/materials.reducer';
import { getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';
import { MaterilasService } from 'src/app/services/materials.service';

@Component({
  selector: 'app-pdf-annotation-toolbar',
  templateUrl: './pdf-annotation-toolbar.component.html',
  styleUrls: ['./pdf-annotation-toolbar.component.css'],
})
export class PdfAnnotationToolbarComponent implements OnInit {
  pinSelected: boolean = false;
  drawingSelected: boolean = false;
  highlightSelected: boolean = false;
  hideAnnotations$: Observable<boolean>;
  materialId: string;
  courseId: string;
  currentZoom: number;

  PdfSearchQuery$: Observable<string>;
  pdfQuery: string;

  constructor(
    private store: Store<State>,
    private materialService: MaterilasService
  ) {
    this.store.select(getCurrentMaterialId).subscribe((id) => {
      this.materialId = id;
    });

    this.store.select(getCurrentCourseId).subscribe((id) => {
      this.courseId = id;
    });
    this.store.select(getPdfZoom).subscribe((pdfZoom) => {
      this.currentZoom = pdfZoom;
    });

    this.hideAnnotations$ = this.store.select(getHideAnnotationValue);
    this.store.select(getSelectedTool).subscribe((tool) => {
      switch (tool) {
        case PdfToolType.Highlight:
          this.highlightSelected = true;
          break;
        case PdfToolType.Pin:
          this.pinSelected = true;
          break;
        case PdfToolType.DrawBox:
          this.drawingSelected = true;
          break;
        case PdfToolType.None:
          this.highlightSelected = false;
          this.pinSelected = false;
          this.drawingSelected = false;
          break;
      }
    });
  }
  ngOnInit(): void {}

  selectAnnotationTool(toolId: string) {
    if (toolId == PdfToolType.Highlight) {
      if (this.highlightSelected) {
        this.resetTools();
        return;
      }
      this.resetTools();
      this.store.dispatch(
        AnnotationActions.setSelectedTool({
          selectedTool: PdfToolType.Highlight,
        })
      );
      this.highlightSelected = true;
    }
    if (toolId == PdfToolType.Pin) {
      if (this.pinSelected) {
        this.resetTools();
        return;
      }
      this.resetTools();
      this.store.dispatch(
        AnnotationActions.setSelectedTool({ selectedTool: PdfToolType.Pin })
      );
      this.pinSelected = true;
    }
    if (toolId == PdfToolType.DrawBox) {
      if (this.drawingSelected) {
        this.resetTools();
        return;
      }
      this.resetTools();
      this.store.dispatch(
        AnnotationActions.setShowDrawBoxTools({ show: true })
      );
      this.drawingSelected = true;
    }
  }

  pdfSearchQuery(event: Event) {
    this.store.dispatch(
      AnnotationActions.setPdfSearchQuery({ pdfSearchQuery: this.pdfQuery })
    );
  }

  pdfZoom(buttonId: string) {
    let payload: {
      materialId: string;
      courseId: string;
      buttonId: string;
      oldZoom: number;
      newZoom?: number; // Optional until it's updated
    } = {
      materialId: this.materialId,
      courseId: this.courseId,
      buttonId: buttonId,
      oldZoom: this.currentZoom,
    };

    if (buttonId == 'zoomIn')
      this.store.dispatch(AnnotationActions.setZoomIn());

    if (buttonId == 'zoomOut')
      this.store.dispatch(AnnotationActions.setZoomOut());

    if (buttonId == 'resetZoom')
      this.store.dispatch(AnnotationActions.resetZoom());

    payload.newZoom = this.currentZoom; // After Updating the zoom value

    this.materialService.logZoomPDF(payload).subscribe();
  }

  resetTools() {
    this.store.dispatch(
      AnnotationActions.setSelectedTool({ selectedTool: PdfToolType.None })
    );
    this.store.dispatch(AnnotationActions.setShowDrawBoxTools({ show: false }));
    this.highlightSelected = false;
    this.drawingSelected = false;
    this.pinSelected = false;
  }

  toggleShowHideAnnotations() {
    this.store.dispatch(AnnotationActions.toggleShowHideAnnotation());
  }
}
