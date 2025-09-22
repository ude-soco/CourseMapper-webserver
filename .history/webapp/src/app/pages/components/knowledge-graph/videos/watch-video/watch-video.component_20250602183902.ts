import { Component, Input, OnInit, SecurityContext } from '@angular/core';
import { VideoElementModel } from '../models/video-element.model';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Material } from 'src/app/models/Material';

@Component({
  selector: 'app-watch-video',
  templateUrl: './watch-video.component.html',
  styleUrls: ['./watch-video.component.css'],
})
export class WatchVideoComponent {
  @Input() currentMaterial?: Material;
  @Input() public video!: VideoElementModel;
  @Input()
  public notUnderstoodConcepts: string[];
  public safeURL: SafeResourceUrl;
  constructor(private sanitizer: DomSanitizer) {}
  ngOnInit(): void {
    // Enable jsapi. This allows us to control the video through the iframe
    let newUri = new URL(this.video.uri);
    newUri.searchParams.append('enablejsapi', '1');
    this.safeURL = this.sanitizer.bypassSecurityTrustResourceUrl(newUri.href);
  }
}
