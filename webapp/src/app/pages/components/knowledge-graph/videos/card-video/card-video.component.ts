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
  @Input() TabSaved = false;

  // boby024
  isDescriptionFullDisplayed = false;
  isBookmarkFill = false;
  videoDescription = "";
  saveOrRemoveParams = {"user_id": "", "rid": "", "status": false};
  saveOrRemoveStatus = false;

  ngOnInit(): void {}
  public readVideo(videoElement: any): void {
    console.log('card video');
    this.videoElement = videoElement;
    this.onClick.emit(this.videoElement.id);
    this.isActive = !this.isActive;
    this.showModal = !this.showModal;
    this.onWatchVideo.emit(videoElement);

    this.showLabelMoreDescription();
    this.isBookmarkFill = this.TabSaved === true ? true : false;
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
    // console.warn("this - rec id -> ", this.videoElement.id);
    this.isBookmarkFill = this.isBookmarkFill === true ? false : true;
    this.saveOrRemoveParams = {"user_id": this.userId, "rid": this.videoElement.rid, "status": this.isBookmarkFill};
    this.SaveOrRemoveUserResource(this.saveOrRemoveParams);
    this.saveOrRemoveBookmark();
  }

  saveOrRemoveBookmark() {
    // detail: 'Open your Bookmark List to find this video'
    if (this.isBookmarkFill === true) {
      if (this.saveOrRemoveStatus === true) {
        this.messageService.add({ key: 'resource_bookmark', severity: 'success', summary: '', detail: 'Successfully to the bookmark added'});
      }
    } else {
      if (this.saveOrRemoveStatus === false) {
        this.messageService.add({key: 'resource_bookmark', severity: 'info', summary: '', detail: 'Successfully to the bookmark removed'});
      }
    }
  }

  SaveOrRemoveUserResource(params) {
    this.materialsRecommenderService.SaveOrRemoveUserResource(params)
      .subscribe({
        next: (data: any) => {
          if (data == null) {
            this.saveOrRemoveStatus = true;
          } else {
            this.saveOrRemoveStatus = false;
          }
        },
        error: (err) => {
          console.log(err);
          this.saveOrRemoveStatus = false;
        },
      }
    );
  }
}
