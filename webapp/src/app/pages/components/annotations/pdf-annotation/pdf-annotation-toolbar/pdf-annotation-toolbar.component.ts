import { Component, EventEmitter, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-pdf-annotation-toolbar',
  templateUrl: './pdf-annotation-toolbar.component.html',
  styleUrls: ['./pdf-annotation-toolbar.component.css']
})
export class PdfAnnotationToolbarComponent implements OnInit {

  @Output() showAnnotationDialog: EventEmitter<void> = new EventEmitter();
  @Output() selectedToolEvent: EventEmitter<string> = new EventEmitter();
  @Output() resetToolEvent: EventEmitter<boolean> = new EventEmitter();

  selectedTool = ""
  pinSelected = false
  drawingSelected = false
  highlightSelected = false;
  constructor() { }

  ngOnInit(): void {
    this.selectedToolEvent.emit("none");
  }
  onHighlightButtonClicked() {
    this.pinSelected = false;
    this.drawingSelected = false
    this.highlightSelected = !this.highlightSelected
    this.showAnnotationDialog.emit();
    this.selectedToolEvent.emit("highlightTool")
    this.selectedTool = "highlight"
    if (this.highlightSelected == false) {
      this.resetTool()
    }
  }

  resetTool() {
    this.selectedTool = ""
    this.pinSelected = false;
    this.drawingSelected = false
    this.highlightSelected = false
    this.resetToolEvent.emit(true)
  }

}
