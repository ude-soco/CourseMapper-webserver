import { Component, EventEmitter, Input, Output } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-tab-menu',
  templateUrl: './tab-menu.component.html',
  styleUrls: ['./tab-menu.component.css'],
})
export class TabMenuComponent {
  @Input() tabOptions: MenuItem[];
  @Input() activeItem: MenuItem;
  @Input() menuOptions: MenuItem[];
  @Output() onTabChange: EventEmitter<MenuItem> = new EventEmitter<MenuItem>();

  constructor() {}

  onTabSwitched(event$) {
    this.onTabChange.emit(event$);
  }
}
