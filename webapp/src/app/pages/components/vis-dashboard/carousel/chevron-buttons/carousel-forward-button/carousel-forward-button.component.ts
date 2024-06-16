import {Component, EventEmitter, Output} from '@angular/core';

@Component({
  selector: 'app-carousel-forward-button',
  templateUrl: './carousel-forward-button.component.html',
  styleUrls: ['./carousel-forward-button.component.css']
})
export class CarouselForwardButtonComponent {
  @Output() forwardClick = new EventEmitter<void>();

  onClick(): void {
    this.forwardClick.emit();
  }

}
