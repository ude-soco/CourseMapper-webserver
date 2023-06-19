import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-switch-input',
  templateUrl: './switch-input.component.html',
  styleUrls: ['./switch-input.component.css'],
})
export class SwitchInputComponent {
  @Input() isUnreadChecked: boolean;
}
