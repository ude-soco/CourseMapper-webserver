import { AfterViewChecked, AfterViewInit, ChangeDetectorRef, Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable, Subscriber, Subscription } from 'rxjs';
import { Material } from 'src/app/models/Material';
import { PdfviewService } from 'src/app/services/pdfview.service';
import { environment } from 'src/environments/environment';
import { getCurrentMaterial, getCurrentMaterialId } from '../../../materils/state/materials.reducer';
import { State } from '../state/video.reducer';



@Component({
  selector: 'app-video-main-annotation',
  templateUrl: './video-main-annotation.component.html',
  styleUrls: ['./video-main-annotation.component.css']
})
export class VideoMainAnnotationComponent implements OnInit, OnDestroy, AfterViewInit, AfterViewChecked {

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

  constructor(private store: Store<State>, private pdfViewService: PdfviewService, private changeDetectorRef: ChangeDetectorRef) {
  }
  ngAfterViewChecked(): void {
  }
  
  ngAfterViewInit(): void {
    console.log('zoom');
    this.onResize();
    window.addEventListener('resize', this.onResize.bind(this));
  }

  onResize(): void {
    this.videoWidth = this.YouTubePlayerArea.nativeElement.clientWidth;
    this.videoHeight = this.videoWidth * 0.7;
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
}
