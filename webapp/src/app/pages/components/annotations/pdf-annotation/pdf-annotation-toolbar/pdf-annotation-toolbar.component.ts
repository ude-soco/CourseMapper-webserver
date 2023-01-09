import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { isHighlightSelected, State } from '../state/annotation.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'

@Component({
  selector: 'app-pdf-annotation-toolbar',
  templateUrl: './pdf-annotation-toolbar.component.html',
  styleUrls: ['./pdf-annotation-toolbar.component.css']
})
export class PdfAnnotationToolbarComponent implements OnInit {

  @Output() showAnnotationDialog: EventEmitter<void> = new EventEmitter();
  @Output() selectedToolEvent: EventEmitter<string> = new EventEmitter();
  @Output() resetToolEvent: EventEmitter<boolean> = new EventEmitter();

  selectedTool: string
  pinSelected = false
  drawingSelected = false
  highlightSelected$: Observable<boolean>;
  constructor(private store: Store<State>) { }

  ngOnInit(): void {
    this.selectedToolEvent.emit("none");
  }
  onHighlightButtonClicked() {
    this.pinSelected = false;
    this.drawingSelected = false
    this.store.dispatch(AnnotationActions.toggleHighlightSelected());
    this.highlightSelected$ = this.store.select(isHighlightSelected)
    this.showAnnotationDialog.emit();
    this.selectedToolEvent.emit("highlightTool")
    let selectedTool = "highlight"
    this.store.dispatch(AnnotationActions.setSelectedTool({selectedTool}));
    if (!this.highlightSelected$) {
      this.resetTool()
    }
  }

  resetTool() {
    this.pinSelected = false;
    this.drawingSelected = false
    this.store.dispatch(AnnotationActions.toggleHighlightSelected());
    let selectedTool = "none"
    this.store.dispatch(AnnotationActions.setSelectedTool({selectedTool}));
    this.resetToolEvent.emit(true)
  }

}
