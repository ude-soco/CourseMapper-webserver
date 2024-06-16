import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-carousel-backward-button',
  templateUrl: './carousel-backward-button.component.html',
  styleUrls: ['./carousel-backward-button.component.css']
})
export class CarouselBackwardButtonComponent {
  @Output() backwardClick = new EventEmitter<void>();

  onClick(): void {
    this.backwardClick.emit();
  }
}
