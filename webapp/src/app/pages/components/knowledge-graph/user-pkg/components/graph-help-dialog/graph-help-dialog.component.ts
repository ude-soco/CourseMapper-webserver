import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-graph-help-dialog',
  templateUrl: './graph-help-dialog.component.html',
  styleUrls: ['./graph-help-dialog.component.css']
})
export class GraphHelpDialogComponent {
  @Input() visible = false;
  @Output() close = new EventEmitter<void>();

  onClose(): void {
    this.close.emit();
  }

  highlightAction(action: string): void {
    // Optional: Add visual feedback or animation when user clicks on action cards
    console.log(`[Help Dialog] User exploring: ${action}`);
  }
}
