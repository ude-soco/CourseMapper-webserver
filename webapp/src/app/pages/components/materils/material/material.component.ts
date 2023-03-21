import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
  SimpleChanges,
} from '@angular/core';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { ElementRef, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Material } from 'src/app/models/Material';
import { PdfviewService } from 'src/app/services/pdfview.service';
import { MaterilasService } from 'src/app/services/materials.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import {
  getChannelSelected,
  State,
} from 'src/app/pages/components/materils/state/materials.reducer';
import * as MaterialActions from 'src/app/pages/components/materils/state/materials.actions';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
@Component({
  selector: 'app-material',
  templateUrl: './material.component.html',
  styleUrls: ['./material.component.css'],
})
export class MaterialComponent implements OnInit, OnDestroy {
  @Output() public channelEmitted = new EventEmitter<any>();
  selectedChannel: Channel;
  channelSelected$: Observable<boolean>;
  index = 0;
  selectedMaterial?: Material;
  @Input() channel?: Channel;
  @Input() courseID?: string;
  @Input() topicID?: string;
  @Input() initialMaterial?: Material;
  @Output() materialCreated: EventEmitter<void> = new EventEmitter();
  private channels: Channel[] = [];
  materials: Material[] = [];
  materialType?: string;
  tabIndex: number = -1;
  isMaterialSelected: boolean = false;

  isNewMaterialModalVisible: boolean = false;
  errorMessage: any;
  constructor(
    private topicChannelService: TopicChannelService,
    private pdfViewService: PdfviewService,
    private materialService: MaterilasService,
    private router: Router,
    private store: Store<State>,
    private route: ActivatedRoute,
  ) {
  const url = this.router.url;
  if(url.includes('course') && url.includes('channel')){
    const courseRegex = /\/course\/(\w+)/;
    const channelRegex = /\/channel\/(\w+)/;
    const courseId = courseRegex.exec(url)[1];
    const channelId = channelRegex.exec(url)[1];
    const materialId = url.match(/material:(.*?)\/(pdf|video)/)?.[1];
    this.topicChannelService.getChannel(courseId, channelId).subscribe(foundChannel => {
      this.selectedChannel = foundChannel;
      this.materials = foundChannel.materials;
      this.channels.push(this.selectedChannel);
      this.selectedMaterial = foundChannel.materials.find(material => material._id == materialId);
      this.tabIndex = foundChannel.materials.findIndex(material => material._id == materialId) + 1;
      this.store.dispatch(MaterialActions.toggleChannelSelected({channelSelected: true}));
      this.updateSelectedMaterial();
    });
  }

  }
  ngOnDestroy(): void {
  }

  ngOnInit(): void {
    this.topicChannelService.onSelectChannel.subscribe((channel) => {
      this.selectedChannel = channel;
      this.channelEmitted.emit(this.selectedChannel);
      this.materials = [];
      if (!this.selectedChannel?.materials) {

      } else {
        this.topicChannelService
          .getChannelDetails(this.selectedChannel)
          .subscribe({
            next: (data) => {
              this.channels = data;

              if (this.selectedChannel._id === this.channels['_id']) {
                this.materials = this.channels['materials'];
              } else {
                this.selectedChannel._id = this.channels['_id'];
              }
            },
            error: (err) => {
              this.errorMessage = err.error.message;
            },
          });
      }
    });
  }

  onTabChange(e) {
    this.tabIndex = e.index - 1;
    if (this.tabIndex == -1) {
      this.isMaterialSelected = false;
      this.router.navigate([
        'course',
        this.selectedChannel.courseId,
        'channel',
        this.selectedChannel._id,
      ]);
    }
    else {
      this.isMaterialSelected = true;
      this.selectedMaterial = this.materials[this.tabIndex];
      this.updateSelectedMaterial();

      if(this.selectedMaterial.type == 'pdf'){
        this.store.dispatch(
          MaterialActions.setMaterialId({ materialId: this.selectedMaterial._id })
        );
        this.store.dispatch(
          MaterialActions.setCurrentMaterial({ selcetedMaterial: this.selectedMaterial })
        );
        this.store.dispatch(AnnotationActions.loadAnnotations());
        this.router.navigate([
          'course',
          this.selectedMaterial['courseId'],
          'channel',
          this.selectedMaterial['channelId'],
          'material',
          { outlets: { 'material': [this.selectedMaterial._id, 'pdf'] } }
        ]);
      }
      else if(this.selectedMaterial.type == 'video'){
        this.store.dispatch(
          MaterialActions.setMaterialId({ materialId: this.selectedMaterial._id })
        );
        this.store.dispatch(
          MaterialActions.setCurrentMaterial({ selcetedMaterial: this.selectedMaterial })
        );
        this.store.dispatch(AnnotationActions.loadAnnotations());
        this.router.navigate([
          'course',
          this.selectedMaterial['courseId'],
          'channel',
          this.selectedMaterial['channelId'],
          'material',
          { outlets: { 'material': [this.selectedMaterial._id, 'video'] } }
        ]);
      }
    }
  }
  setSelectedTabIndex(index: number) {
    this.selectedMaterial = this.selectedChannel.materials[index];
    this.updateSelectedMaterial();
  }
  updateSelectedMaterial() {
    if (!this.selectedMaterial) return;
    switch (this.selectedMaterial.type) {
      case 'pdf':
        this.pdfViewService.setPageNumber(1);
        let url =
          this.selectedMaterial?.url + this.selectedMaterial?._id + '.pdf';
        this.pdfViewService.setPdfURL(url);
        break;
      case 'video':
        if (this.selectedMaterial?.url == "") {

          let urlvideo =
            "/public/uploads/videos/" + this.selectedMaterial?._id + '.mp4';
          this.pdfViewService.setPdfURL(urlvideo);

        }
        else {
          this.pdfViewService.setPdfURL(this.selectedMaterial?.url);
        }
        break;

      default:
    }
    this.store.dispatch(MaterialActions.setCurrentMaterial({ selcetedMaterial: this.selectedMaterial }));
    this.store.dispatch(MaterialActions.setMaterialId({ materialId: this.selectedMaterial._id }));
    this.store.dispatch(AnnotationActions.loadAnnotations());
  }

  deleteMaterial(e) {
    e.index1 = e.index - 1;

    this.selectedMaterial = this.materials[e.index1];
    if (this.selectedMaterial.type == "video" && this.selectedMaterial.url) {
      this.materialService.deleteMaterial(this.selectedMaterial).subscribe({
        next: (data) => {
          this.topicChannelService.selectChannel(this.selectedChannel)
          this.router.navigate([
            'course',
            this.selectedMaterial['courseId'],
            'channel',
            this.selectedMaterial['channelId'],

          ]);
          e.index = 1

        },
        error: (err) => {
          this.errorMessage = err.error.message;
        },
      });
    }

    else if ((this.selectedMaterial.type == "pdf" && this.selectedMaterial.url) || (this.selectedMaterial.type == "video" && this.selectedMaterial.url == "")) {
      this.materialService.deleteFile(this.selectedMaterial).subscribe({
        next: (res) => {
        },
      });

    }



    this.materialService.deleteMaterial(this.selectedMaterial).subscribe({
      next: (data) => {



        this.topicChannelService.selectChannel(this.selectedChannel)
        this.router.navigate([
          'course',
          this.selectedMaterial['courseId'],
          'channel',
          this.selectedMaterial['channelId'],
        ]);

        e.index = 1

      },
      error: (err) => {
        this.errorMessage = err.error.message;
      },
    });
  }

  reloadCurrentRoute() {
    let currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
  }
}
