import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface CheckboxFilterOption {
  value: string;
  label: string;
}

export interface CheckboxFilterChange {
  value: string;
  checked: boolean;
}

@Component({
  selector: 'app-checkbox-filter',
  templateUrl: './checkbox-filter.component.html',
  styleUrls: ['./checkbox-filter.component.css'],
})
export class CheckboxFilterComponent {
  @Input() title = '';
  @Input() options: CheckboxFilterOption[] = [];
  @Input() selectedValues: string[] = [];

  // Optional input to display counts next to each option
  @Input() counts: Record<string, number> = {};

  @Output() filterChange = new EventEmitter<CheckboxFilterChange>();
  @Output() onSelectAllEvent = new EventEmitter<void>();
  @Output() onClearAllEvent = new EventEmitter<void>();

  onSelectAll() {
    this.onSelectAllEvent.emit();
  }
  onClearAll() {
    this.onClearAllEvent.emit();
  }

  onToggleOption(value: string, event: Event) {
    this.filterChange.emit({
      value,
      checked: (event.target as HTMLInputElement).checked,
    });
  }
}
