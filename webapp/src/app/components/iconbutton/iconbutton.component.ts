import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-iconbutton',
  templateUrl: './iconbutton.component.html',
  styleUrls: ['./iconbutton.component.css'],
})
export class IconbuttonComponent implements OnInit {
  /**
   * How to use the component:
   * 1. Use the boxicons
   * 2. Use the tailwindcss text colors
   * 3. Use the onClick eventHandler
   * <app-iconbutton
   icon="bx-dots-vertical-rounded"
   color="text-orange-500"
   (onClick)="showMenu()"
   ></app-iconbutton>
   */
  @Input() icon: string = '';
  @Input() color: string = 'text-white';

  @Output() onClick: EventEmitter<void> = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  btnClick() {
    this.onClick.emit();
  }
}
