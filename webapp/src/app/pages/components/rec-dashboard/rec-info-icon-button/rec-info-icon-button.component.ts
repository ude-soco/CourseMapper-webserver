import { Component, EventEmitter, Input, Output } from '@angular/core';
import { OverlayPanel } from 'primeng/overlaypanel';

@Component({
  selector: 'app-rec-info-icon-button',
  templateUrl: './rec-info-icon-button.component.html',
  styleUrls: ['./rec-info-icon-button.component.css'],
})
export class RecInfoIconButtonComponent {
  @Input() rawRecScore!: number;
  @Input() courseId!: string;

  @Output() scoreInfoClick = new EventEmitter<{
    event: Event;
    panel: OverlayPanel;
  }>();
  
  @Output() scoreInfoHide = new EventEmitter<OverlayPanel>();

  //
  toggleScorePanel(event: Event, panel: OverlayPanel): void {
    event.stopPropagation();
    this.scoreInfoClick.emit({ event, panel });
  }

  // To avoid having multiple score info overlay panels open at the same time, we emit the hide event
  // when the overlay panel is closed, so that the parent component can update its state accordingly.
  onPanelHide(panel: OverlayPanel): void {
    this.scoreInfoHide.emit(panel);
  }
}
