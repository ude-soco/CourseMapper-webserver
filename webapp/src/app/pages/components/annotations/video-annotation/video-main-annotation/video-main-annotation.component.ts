import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscriber, Subscription } from 'rxjs';
import { DrawingData } from 'src/app/models/Drawing';
import { Material } from 'src/app/models/Material';
import { PdfviewService } from 'src/app/services/pdfview.service';
import { environment } from 'src/environments/environment';
import { getCurrentMaterial, getCurrentMaterialId } from '../../../materils/state/materials.reducer';
import { getIsBrushSelectionActive, State } from '../state/video.reducer';



@Component({
  selector: 'app-video-main-annotation',
  templateUrl: './video-main-annotation.component.html',
  styleUrls: ['./video-main-annotation.component.css']
})
export class VideoMainAnnotationComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('YouTubePlayerArea') YouTubePlayerArea: ElementRef<HTMLDivElement>;
  @ViewChild('videoPlayer', { static: false }) videoPlayer: ElementRef;
  apiLoaded = false;
  materilaId: string;
  material: Material;
  videoURL = null;
  subscriptions: Subscription[] = [];
  youtubeactivated: boolean;
  private API_URL = environment.API_URL;
  isAnnotationDialogVisible$: Observable<boolean>;
  YouTubePlayer : YT.Player;
  videoWidth: number;
  videoHeight: number;
  drawingData: any;
  isBrushSelectionActive$ : Observable<boolean>;
  boundingRect: DOMRect;

  constructor(private store: Store<State>, private pdfViewService: PdfviewService, private changeDetectorRef: ChangeDetectorRef) {
    this.isBrushSelectionActive$ = this.store.select(getIsBrushSelectionActive);
  }
  ngAfterViewChecked(): void {
    this.boundingRect = this.YouTubePlayerArea?.nativeElement.getBoundingClientRect();
    this.videoWidth = this.boundingRect.width;
    this.videoHeight = this.boundingRect.height;
    this.changeDetectorRef.detectChanges();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }

  ngOnInit(): void {
    let materialSubscriper = this.store.select(getCurrentMaterial).subscribe((material) => {
      if(material.type === "video"){
        this.material = material;
        this.materilaId = material._id;
        this.getVideoUrl();
      }
    })
    this.subscriptions.push(materialSubscriper);
    if (!this.apiLoaded) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      this.apiLoaded = true;
    }
  }

  getVideoUrl() {
    let urlSubscriper = this.pdfViewService.currentDocURL.subscribe((url) => {
      if (this.material.url) {
        let videoID = this.extractIdFromLink(url);
        this.youtubeactivated = true;
        this.videoURL = videoID;
      }
      else {
        this.youtubeactivated = false;
        this.videoURL = this.API_URL + url.replace(/\\/g, '/');
        this.videoPlayer?.nativeElement.load();
        this.videoPlayer?.nativeElement.play();
      }
    })
    this.subscriptions.push(urlSubscriper);

  }

  video() {
    this.videoPlayer.nativeElement.play();
  }

  PauseVideo() {
    this.videoPlayer.nativeElement.pause();
  }

  saveYouTubePlayer(player) {
    this.YouTubePlayer = player.target;
    console.log("player instance", player);

    const iframe = player.target.h
    iframe.style.width = "100%";
    iframe.style.height = "100%";
    iframe.style.minHeight = "700px";

    this.boundingRect = this.YouTubePlayerArea?.nativeElement.getBoundingClientRect();
    this.videoWidth = this.boundingRect.width;
    this.videoHeight = this.boundingRect.height;
    console.log(this.boundingRect);
  }

  onYouTubePlayerStateChange(event) {
    console.log("player state", event.data);
  }

  extractIdFromLink(link: string): string {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
    const match = link.match(regex);
    return match ? match[1] : '';
  }

  playVideo() {
    this.YouTubePlayer.playVideo();
  }

  pauseVideo() {
    this.YouTubePlayer.pauseVideo();
  }

  drawingChanged(event: DrawingData) {
    // this.drawingData = event;
  }

  doneDrawing() {
    // if (!this.drawingData) return;

    // if (this.drawingData.drawings.length == 0) {
    //   window.alert("You must have at least 1 drawing");
    //   return;
    // }

    // this.showAnnotationDialog();

    // this.isBrushSelectionActive = false;
  }

  cancelSelection() {
    // this.isBrushSelectionActive = false;
    // this.isPinpointSelectionActive = false;
    // this.drawingData = undefined;
    // this.pintpointCoordinates = undefined;
    // this.pintpointPosition = undefined;
  }
}
