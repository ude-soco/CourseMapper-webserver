import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscriber, Subscription } from 'rxjs';
import { DrawingData } from 'src/app/models/Drawing';
import { Material } from 'src/app/models/Material';
import { PdfviewService } from 'src/app/services/pdfview.service';
import { environment } from 'src/environments/environment';
import { getCurrentMaterial, getCurrentMaterialId } from '../../../materils/state/materials.reducer';
import { getIsBrushSelectionActive, getIsPinpointSelectionActive, getIsVideoPaused, getIsVideoPlayed, State } from '../state/video.reducer';
import * as VideoActions from '../state/video.action'
import { calculateMousePositionInVideo } from 'src/app/_helpers/video-helper';
import { Socket } from 'ngx-socket-io';
import { Annotation } from 'src/app/models/Annotations';
import { Reply } from 'src/app/models/Reply';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'



@Component({
  selector: 'app-video-main-annotation',
  templateUrl: './video-main-annotation.component.html',
  styleUrls: ['./video-main-annotation.component.css']
})
export class VideoMainAnnotationComponent implements OnInit, OnDestroy, AfterViewChecked {

  @ViewChild('YouTubePlayerArea') YouTubePlayerArea: ElementRef<HTMLDivElement>;
  @ViewChild('video', { static: false }) videoPlayer: ElementRef<HTMLVideoElement>;
  YouTubeTimeUpdateInterval?: number;
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
  boundingRect: DOMRect;
  isPinpointSelectionActive: boolean = false;
  isBrushSelectionActive: boolean = false;
  drawingData?: DrawingData;
  pintpointCoordinates?: [number, number]
  pintpointPosition?: [number, number]

  constructor(private store: Store<State>, private pdfViewService: PdfviewService, private changeDetectorRef: ChangeDetectorRef, private socket: Socket) {
    this.store.select(getIsBrushSelectionActive).subscribe((isActive) => this.isBrushSelectionActive = isActive);
    this.store.select(getIsPinpointSelectionActive).subscribe((isActive) => this.isPinpointSelectionActive = isActive);
  }

  ngAfterViewChecked(): void {
    if(this.youtubeactivated){
      this.boundingRect = this.YouTubePlayerArea?.nativeElement.getBoundingClientRect();
      this.videoWidth = this.boundingRect.width;
      this.videoHeight = this.boundingRect.height;
      this.changeDetectorRef.detectChanges();
    }
    else{
      this.boundingRect = this.videoPlayer?.nativeElement.getBoundingClientRect();
      this.videoWidth = this.boundingRect.width;
      this.videoHeight = this.boundingRect.height;
      this.changeDetectorRef.detectChanges();
    }
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
    this.socket.on(this.material._id, (payload: { eventType: string, annotation: Annotation, reply: Reply }) => {
      console.log('payload = ', payload)
        this.store.dispatch(AnnotationActions.updateAnnotationsOnSocketEmit({payload: payload}));
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
      }
    })
    this.subscriptions.push(urlSubscriper);

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

    this.store.dispatch(VideoActions.SetVideoDuration({videoDuration: Math.floor(this.YouTubePlayer.getDuration())}));

    let currentTime = -1;

    this.YouTubeTimeUpdateInterval = window.setInterval(() => {
      if (!this.YouTubePlayer?.getCurrentTime) return;

      const time = this.YouTubePlayer.getCurrentTime();
      if (time != currentTime) {
        this.store.dispatch(VideoActions.SetCurrentTime({currentTime: Math.floor(time)}));
        currentTime = time;
      }
    }, 1000);
  }

  onYouTubePlayerStateChange(event) {
    console.log("player state", event.data);
    if(event.data === 1){
      this.store.dispatch(VideoActions.PlayVideo());
    }else if(event.data === 2){
      this.store.dispatch(VideoActions.PauseVideo());
    }
  }

  extractIdFromLink(link: string): string {
    const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/;
    const match = link.match(regex);
    return match ? match[1] : '';
  }

  playVideo() {
    if(this.youtubeactivated){
      this.YouTubePlayer.playVideo();
    }else{
      this.videoPlayer.nativeElement.play();
    }
  }

  pauseVideo() {
    if(this.youtubeactivated){
      this.YouTubePlayer.pauseVideo();
    }else{
      this.videoPlayer?.nativeElement.pause();
    }
  }

  videoPlayed() {
    this.store.dispatch(VideoActions.PlayVideo());
  }

  videoPaused() {
    this.store.dispatch(VideoActions.PauseVideo());
  }

  videoPlayerTimeChanged(event: any){
    this.store.dispatch(VideoActions.SetCurrentTime({currentTime: Math.floor((event.target! as HTMLVideoElement).currentTime)}));
  }

  videoPlayerReady(event: any){
    this.store.dispatch(VideoActions.SetVideoDuration({videoDuration: Math.floor(this.videoPlayer?.nativeElement.duration)}));
  }

  drawingChanged(drawings: DrawingData) {
    this.drawingData = drawings;
  }

  doneDrawing() {
    if (!this.drawingData) return;

    if (this.drawingData.drawings.length == 0) {
      window.alert("You must have at least 1 drawing");
      return;
    }

    this.showAnnotationDialog();

    this.store.dispatch(VideoActions.setIsBrushSelectionActive({isBrushSelectionActive: false}));
  }

  cancelSelection() {
    this.store.dispatch(VideoActions.setIsBrushSelectionActive({isBrushSelectionActive: false}));
    this.isPinpointSelectionActive = false;
    this.drawingData = undefined;
    this.pintpointCoordinates = undefined;
    this.pintpointPosition = undefined;
  }

  showAnnotationDialog(){
    

  }

  setPintpointPosition(event: MouseEvent){
    let boundingRect;
    if(this.youtubeactivated){
      boundingRect = this.YouTubePlayerArea?.nativeElement.getBoundingClientRect();
    }
    else{
      boundingRect = this.videoPlayer?.nativeElement.getBoundingClientRect();
    }

    if (!this.videoWidth || !this.videoHeight || !boundingRect) return;

    const {isInsideVideo, xRatio, yRatio, xPosition, yPosition} = calculateMousePositionInVideo(
      event.clientX,
      event.clientY,
      boundingRect,
      this.videoWidth,
      this.videoHeight,
    );

    if (!isInsideVideo) return;

    this.pintpointCoordinates = [xRatio, yRatio];
    this.pintpointPosition = [xPosition, yPosition];

    this.showAnnotationDialog();

    this.store.dispatch(VideoActions.setIsPinpointSelectionActive({isPinpointSelectionActive: false}));
  }
}
