import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

@Component({
  selector: 'app-avatar',
  templateUrl: './avatar.component.html',
  styleUrls: ['./avatar.component.css'],
})
export class AvatarComponent implements OnInit {
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
  @Input() label: string = '';
  @Input() color: string = '';

  @Output() onClick: EventEmitter<void> = new EventEmitter();

  constructor() {}

  ngOnInit(): void {}

  btnClick() {
    this.onClick.emit();
  }
}
