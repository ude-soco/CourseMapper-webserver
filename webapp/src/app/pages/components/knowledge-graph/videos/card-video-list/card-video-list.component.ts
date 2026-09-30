import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  Output,
  ViewChild,
} from '@angular/core';
import { VideoElementModel } from '../models/video-element.model';
import { videoMock } from '../mocks/video.mock';
import { Router } from '@angular/router';
import { Material } from 'src/app/models/Material';

@Component({
  selector: 'app-card-video-list',
  templateUrl: './card-video-list.component.html',
  styleUrls: ['./card-video-list.component.css'],
})
export class CardVideoListComponent {
  @ViewChild('videoPlayer', { static: false }) videoplayer: ElementRef;

  @Input()
  public videoElements: VideoElementModel[] = [];
  @Input()
  public notUnderstoodConcepts: string[];
  public showVideo = false;
  public video: VideoElementModel;
  @Input() userId: string;
  @Input() resultTabType: string = "";
  @Input() currentMaterial?: Material;

  @Output() backButtonClicked: EventEmitter<void> = new EventEmitter();

  constructor(private route: Router) {}

  public readVideo(videoElement: VideoElementModel): void {
    this.showVideo = !this.showVideo;
    this.video = videoElement;
    this.route.navigate(['/dashboard/watch/', this.video.id]);
  }

  goBack(): void {
    this.showVideo = !this.showVideo;
    this.backButtonClicked.emit(); // Notify the parent
  }

  onResourceRemovedEvent(rid: string) {
    this.videoElements = this.videoElements.filter(video => video.rid !== rid);
  }
}
