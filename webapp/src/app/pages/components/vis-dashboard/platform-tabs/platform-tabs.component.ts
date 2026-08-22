import { Component, EventEmitter, Input, Output ,OnInit} from '@angular/core';

@Component({
  selector: 'app-platform-tabs',
  templateUrl: './platform-tabs.component.html',
  styleUrls: ['./platform-tabs.component.css']
})
export class PlatformTabsComponent implements  OnInit{
  @Input() platforms: string[] = [];
  @Output() platformSelected = new EventEmitter<string>();

  selectedPlatform: string | null = null;


  constructor() {

  }



  selectPlatform(platform: string) {
  this.selectedPlatform= platform
    this.platformSelected.emit(platform);
  }

  ngOnInit(): void {
    this.selectedPlatform = this.platforms.length > 0 ? this.platforms[0] : null;
    this.platformSelected.emit(this.selectedPlatform);
  }

}
