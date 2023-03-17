import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.css'],
})
export class ButtonComponent implements OnInit {
  /**
   * How to use the component:
   * <app-button
   variant="contained"
   label="Login"
   icon="bx-log-in-circle"
   (onClick)="login()"
   ></app-button>
   */
  @Input() variant: string = 'default';
  @Input() label: string = 'button';
  @Input() icon: string = '';

  @Output() onClick: EventEmitter<void> = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  btnClick() {
    this.onClick.emit();
  }
}
