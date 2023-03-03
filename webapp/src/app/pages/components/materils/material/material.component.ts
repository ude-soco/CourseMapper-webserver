import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
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
export class MaterialComponent implements OnInit{
  @Output() public channelEmitted = new EventEmitter<any>();
  //@Input() public materialEmiited :any ;
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
  // selectAfterAdding: boolean;
  // tabs = [];
  // selected = new FormControl(0);
  //tabtitle:string = '';
  constructor(
    private topicChannelService: TopicChannelService,
    private pdfViewService: PdfviewService,
    private materialService: MaterilasService,
    private router: Router,
    private store: Store<State>,
    private route: ActivatedRoute,
  ) {

    this.channelSelected$ = store.select(getChannelSelected);
  }


  // ngOnChanges() {
  //   console.log("noew ng change working")
  // }
  ngOnInit(): void {
    this.topicChannelService.onSelectChannel.subscribe((channel) => {
      this.selectedChannel = channel;
      this.channelEmitted.emit(this.selectedChannel);
      this.materials = [];
      if (!this.selectedChannel?.materials) {
        // console.log('empty material');
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
    if (this.tabIndex == -1) this.isMaterialSelected = false;
    else this.isMaterialSelected = true;

    this.setSelectedTabIndex(this.tabIndex || 0);

    this.selectedMaterial = this.channels['materials'][this.tabIndex || 0];

    this.router.navigate([
      'course',
      this.selectedMaterial['courseId'],
      'channel',
      this.selectedMaterial['channelId'],
      'material',
      this.selectedMaterial._id,
    ]);
    this.store.dispatch(
      MaterialActions.setMaterialId({ materialId: this.selectedMaterial._id })
    );
    this.store.dispatch(AnnotationActions.loadAnnotations());
  }
  setSelectedTabIndex(index: number) {
    this.selectedMaterial = this.channels['materials'][index];
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

      default:
    }
  }

  deleteMaterial(e) {
    console.log('e.index delete');

    console.log(e.index);
    e.index1 = e.index - 1;

    this.selectedMaterial = this.channels['materials'][e.index1];

    this.materialService.deleteMaterial(this.selectedMaterial).subscribe({
      next: (data) => {
        console.log(data);

        this.materialService.deleteFile(this.selectedMaterial).subscribe({
          next: (res) => {
            console.log(res);
          },
        });
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
