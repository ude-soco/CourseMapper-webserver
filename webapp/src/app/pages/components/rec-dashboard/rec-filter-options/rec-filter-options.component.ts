import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-rec-filter-options',
  templateUrl: './rec-filter-options.component.html',
  styleUrls: ['./rec-filter-options.component.css']
})
export class RecFilterOptionsComponent {
  @Input() disable_select_all: boolean = false;
  @Input() disable_clear_all: boolean = false;

  @Output() onSelectAllEvent = new EventEmitter<void>();
  @Output() onClearAllEvent = new EventEmitter<void>();
  
  onSelectAll() {
    this.onSelectAllEvent.emit();
  }
  onClearAll() {
    this.onClearAllEvent.emit();
  }
}
