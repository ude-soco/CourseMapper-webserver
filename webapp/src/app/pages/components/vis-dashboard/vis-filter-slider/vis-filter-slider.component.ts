import { Component,EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-vis-filter-slider',
  templateUrl: './vis-filter-slider.component.html',
  styleUrls: ['./vis-filter-slider.component.css']
})
export class VisFilterSliderComponent {
  @Input() minValue: number = 5
  @Input() maxValue: number = 20
  @Input() step: number;
  @Output() valueChange = new EventEmitter<number>();
  showSlider:boolean = true
  @Input() datapointCount: number

  sliderValue: number;

  constructor() {
    this.sliderValue = this.minValue;
  }

  onSliderChange(event: any) {
    this.sliderValue = event.target.value;
    this.valueChange.emit(this.sliderValue);
  }

  toggleFilter() {
    this.showSlider = !this.showSlider
  }
}
