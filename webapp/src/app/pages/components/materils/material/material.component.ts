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
   // if (this.tabIndex == 0) this.isMaterialSelected = false;
    else this.isMaterialSelected = true;

    this.setSelectedTabIndex(this.tabIndex );

    this.selectedMaterial = this.channels['materials'][this.tabIndex ];
    

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
    this.store.dispatch(
      MaterialActions.setCurrentMaterial({ selcetedMaterial: this.selectedMaterial })
    );
    this.store.dispatch(AnnotationActions.loadAnnotations());
  }
  setSelectedTabIndex(index: number) {
    this.selectedMaterial = this.channels['materials'][index];
    this.updateSelectedMaterial();
  }
  updateSelectedMaterial() {
    if (!this.selectedMaterial) return;
    console.log("this.selectedMaterial  print whole material details")
    console.log(this.selectedMaterial)
    switch (this.selectedMaterial.type) {
      case 'pdf':
        this.pdfViewService.setPageNumber(1);
        let url =
          this.selectedMaterial?.url + this.selectedMaterial?._id + '.pdf';
        this.pdfViewService.setPdfURL(url);
        console.log("url is empty for pdf")

        break;
        case 'video':
        if(this.selectedMaterial?.url == "")
        {
          
          let urlvideo =
          "/public/uploads/videos/" + this.selectedMaterial?._id + '.mp4';
           this.pdfViewService.setPdfURL(urlvideo);
           console.log(urlvideo)
           console.log("url is empty")

          
        }
        else{   

          this.pdfViewService.setPdfURL(this.selectedMaterial?.url);
          console.log(this.selectedMaterial?.url)
          console.log("url is not empty")
      }


        break;

      default:
    }
  }

  deleteMaterial(e) {
    console.log('e.index delete');

    console.log(e.index);
    e.index1 = e.index - 1;

    this.selectedMaterial = this.channels['materials'][e.index1];
    console.log("this.selectedMaterial with index")
    console.log(this.selectedMaterial)
    if(this.selectedMaterial.type == "video" && this.selectedMaterial.url )
    {
      this.materialService.deleteMaterial(this.selectedMaterial).subscribe({
        next: (data) => {
          console.log(data);
         
  
     
          this.topicChannelService.selectChannel(this.selectedChannel)
  this.router.navigate([
    'course',
    this.selectedMaterial['courseId'],
    'channel',
    this.selectedMaterial['channelId'],
    
  ]); 
  e.index = 1
  
  
   console.log("material deleted")
  
        },
        error: (err) => {
          this.errorMessage = err.error.message;
        },
      });
    }

    else  if((this.selectedMaterial.type == "pdf" && this.selectedMaterial.url )||(this.selectedMaterial.type == "video" && this.selectedMaterial.url== "" ) )
    {   
       this.materialService.deleteFile(this.selectedMaterial).subscribe({
              next: (res) => {
                console.log(res);
                console.log("file material deleted")
              },
            });

      }



    this.materialService.deleteMaterial(this.selectedMaterial).subscribe({
      next: (data) => {
        console.log(data);
       

   
        this.topicChannelService.selectChannel(this.selectedChannel)
this.router.navigate([
  'course',
  this.selectedMaterial['courseId'],
  'channel',
  this.selectedMaterial['channelId'],
  
]); 

e.index = 1

 console.log("material deleted")

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
