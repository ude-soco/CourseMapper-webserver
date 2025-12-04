import { Component, Input, Output, EventEmitter } from '@angular/core';
import { ConceptDetail } from '../../types/user-pkg.types';

export interface ConceptData {
  name: string;
  type?: string;
  abstract?: string;
  wikipedia?: string;
  [key: string]: any;
}

@Component({
  selector: 'app-pkg-concept-details-panel',
  templateUrl: './concept-details-panel.component.html',
  styleUrls: ['./concept-details-panel.component.css']
})
export class PkgConceptDetailsPanelComponent {
  @Input() visible = false;
  @Input() concept: ConceptData | null = null;
  @Input() details: ConceptDetail[] = [];
  
  @Output() close = new EventEmitter<void>();
  @Output() detailClicked = new EventEmitter<ConceptDetail>();

  onClose(): void {
    this.close.emit();
  }

  onDetailClick(detail: ConceptDetail): void {
    this.detailClicked.emit(detail);
  }
}
