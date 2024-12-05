import { Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {VideoElementModel} from '../models/video-element.model';
import { MessageService } from 'primeng/api';
import { MaterialsRecommenderService } from 'src/app/services/materials-recommender.service';

@Component({
  selector: 'app-card-video',
  templateUrl: './card-video.component.html',
  styleUrls: ['./card-video.component.css']
})
export class CardVideoComponent {
  constructor(
    private messageService: MessageService,
    private materialsRecommenderService: MaterialsRecommenderService,
  ) {}

  DESCRIPTION_MAX_LENGTH = 450;
  isActive = false;
  showModal = false;
  selectedConcepts: string[] = [];

  @Input()
  public videoElement: VideoElementModel;
  @Input()
  public notUnderstoodConcepts: string[];
  @Output() onClick: EventEmitter<any> = new EventEmitter();
  @Output() onWatchVideo: EventEmitter<any> = new EventEmitter();
  @Input() userId: string;
  @Input() TabSaved: boolean = false;

  isDescriptionFullDisplayed = false;
  isBookmarkFill = false;
  videoDescription = "";
  saveOrRemoveParams = {"user_id": "", "rid": "", "status": false};
  saveOrRemoveStatus = false;
  @Input() resultTabType: string = "";
  @Output() resourceRemovedEvent = new EventEmitter<string>(); // take rid

  ngOnInit(): void {}
  public readVideo(videoElement: any): void {
    console.log('card video');
    this.videoElement = videoElement;
    this.onClick.emit(this.videoElement.id);
    this.isActive = !this.isActive;
    this.showModal = !this.showModal;
    this.onWatchVideo.emit(videoElement);

    this.showLabelMoreDescription();
  }

  ngOnChanges() {
    this.saveOrRemoveParams.status = this.videoElement?.is_bookmarked_fill;

    this.saveOrRemoveParams.user_id = this.userId;
    this.saveOrRemoveParams.rid = this.videoElement?.rid;
  }

  showLabelMoreDescription() {
    if (this.videoElement?.description.length > 0 ) {
      // let video_description = document.getElementById("video_description");
      // console.warn("video_description ->")
      // if (video_description) {
      //   // video_description.innerHTML += "more"
      //   video_description.innerHTML += "&#8964;"
      // }
    }
  }

  showDescriptionFull() {
    this.isDescriptionFullDisplayed = this.isDescriptionFullDisplayed === true ? false : true;
  }

  addToBookmark() {    
    this.videoElement.is_bookmarked_fill = this.videoElement?.is_bookmarked_fill === true ? false : true;
    this.saveOrRemoveParams.status = this.videoElement?.is_bookmarked_fill;

    this.SaveOrRemoveUserResource(this.saveOrRemoveParams);
    this.onResourceRemovedEvent();
  }

  saveOrRemoveBookmark() {
    // detail: 'Open your Bookmark List to find this video'
    if (this.videoElement.is_bookmarked_fill === true) {
      if (this.saveOrRemoveStatus === true) {
        this.messageService.add({ key: 'resource_bookmark_video', severity: 'success', summary: '', detail: 'Video saved successfully'});
      }
    } else {
      if (this.saveOrRemoveStatus === false) {
        this.messageService.add({key: 'resource_bookmark_video', severity: 'info', summary: '', detail: 'Video removed from saved'});
      }
    }
  }

  SaveOrRemoveUserResource(params) {
    this.materialsRecommenderService.SaveOrRemoveUserResource(params)
      .subscribe({
        next: (data: any) => {
          if (data["msg"] == "saved") {
            this.saveOrRemoveStatus = true;
            this.videoElement.is_bookmarked_fill = true;
          } else {
            this.saveOrRemoveStatus = false;
            this.videoElement.is_bookmarked_fill = false;
          }
          this.saveOrRemoveBookmark();
        },
        error: (err) => {
          console.log(err);
          this.saveOrRemoveStatus = false;
          this.videoElement.is_bookmarked_fill = false;
        },
      }
    );
  }

  onResourceRemovedEvent() {
    if (this.videoElement.is_bookmarked_fill === false && this.resultTabType === "saved") { // this.isBookmarkFill === false 
      this.resourceRemovedEvent.emit(this.videoElement.rid);
    }
  }

  padStringToLength(str) {
    const targetLength = 30;
  
    if (str.length < targetLength) {
      // Pad the string with spaces until it reaches the target length
      return str.padEnd(targetLength, ' ');
    } else {
      // Return the string as is if it's already 50 characters or longer
      return str;
    }
  }
  
}
