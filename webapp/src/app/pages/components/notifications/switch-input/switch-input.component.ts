import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-switch-input',
  templateUrl: './switch-input.component.html',
  styleUrls: ['./switch-input.component.css'],
})
export class SwitchInputComponent {
  @Input() isChecked: boolean;
  @Output() onSwitchToggled = new EventEmitter<boolean>();

  onSwitchToggle($event): void {
    this.onSwitchToggled.emit($event.checked);
  }
}
