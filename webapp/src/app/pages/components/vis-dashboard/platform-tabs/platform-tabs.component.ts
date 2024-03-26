import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-platform-tabs',
  templateUrl: './platform-tabs.component.html',
  styleUrls: ['./platform-tabs.component.css']
})
export class PlatformTabsComponent {
  @Input() platforms: string[] = [];
  @Output() platformSelected = new EventEmitter<string>();

  selectPlatform(platform: string) {
    this.platformSelected.emit(platform);
  }

}
