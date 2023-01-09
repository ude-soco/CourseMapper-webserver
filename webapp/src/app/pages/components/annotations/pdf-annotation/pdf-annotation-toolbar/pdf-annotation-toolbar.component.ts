import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { isHighlightSelected, State } from '../state/annotation.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'
import { PdfToolType } from 'src/app/models/Annotations';

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
  highlightSelected: boolean;
  constructor(private store: Store<State>) { }

  ngOnInit(): void {
    this.selectedToolEvent.emit("none");
    this.highlightSelected$ = this.store.select(isHighlightSelected)
    this.store.select(isHighlightSelected).subscribe(value => {
      this.highlightSelected = value;
    });
  }
  onHighlightButtonClicked() {
    if (!this.highlightSelected) {
      this.store.dispatch(AnnotationActions.toggleHighlightSelected());
      this.store.dispatch(AnnotationActions.setSelectedTool({selectedTool: PdfToolType.Highlight}));
    }else{
      this.store.dispatch(AnnotationActions.toggleHighlightSelected());
      this.store.dispatch(AnnotationActions.setSelectedTool({selectedTool: PdfToolType.None}));
    }
    this.showAnnotationDialog.emit();
    this.selectedToolEvent.emit("highlightTool")
  }

  resetTool() {
  }

}
