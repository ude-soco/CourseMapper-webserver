import { Component, Input, OnInit, SecurityContext} from '@angular/core';
import {VideoElementModel} from '../models/video-element.model';
import {DomSanitizer, SafeResourceUrl} from '@angular/platform-browser';

@Component({
  selector: 'app-watch-video',
  templateUrl: './watch-video.component.html',
  styleUrls: ['./watch-video.component.css']
})
export class WatchVideoComponent {
  @Input() public video!: VideoElementModel;
  @Input()
  public notUnderstoodConcepts: string[];
  public safeURL: SafeResourceUrl;
  constructor(private sanitizer: DomSanitizer) {}
  ngOnInit(): void {
    this.safeURL = this.sanitizer.bypassSecurityTrustResourceUrl(this.video.uri);
  }
}
