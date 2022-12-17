import { Component, EventEmitter, Input, OnInit, Output, SimpleChanges } from '@angular/core';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { ElementRef, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import { Material } from 'src/app/models/Material';
import { PdfviewService } from 'src/app/services/pdfview.service';



@Component({
  selector: 'app-material',
  templateUrl: './material.component.html',
  styleUrls: ['./material.component.css']
})
export class MaterialComponent implements OnInit {

  selectedChannel: Channel;
  index = 0;
  selectedMaterial?: Material;
  @Input() channel?: Channel;
  @Input() courseID?: string;
  @Input() topicID?: string;
  @Input() initialMaterial?: Material;
  @Output() materialCreated: EventEmitter<void> = new EventEmitter();
  private channels: Channel[] = [];
   materials: Material[] = [];
   materialType?:string;

  isNewMaterialModalVisible: boolean = false;
  errorMessage: any;
 // selectAfterAdding: boolean; 
  // tabs = [];
 // selected = new FormControl(0);
  //tabtitle:string = '';
  constructor(private topicChannelService: TopicChannelService,private pdfViewService: PdfviewService) { }

  ngOnInit(): void {
    
    this.topicChannelService.onSelectChannel.subscribe((channel) => {
      this.selectedChannel = channel;
      console.log("hhhhh");
      this.materials=[]
      //console.log(this.selectedChannel.courseId)
     // alert(`onChannelSelect ${channel.materials}`);
     if (!(this.selectedChannel.materials.length>0))
     {
console.log("biigggg")
     }
     else {
              this.topicChannelService.getChannelDetails(this.selectedChannel).subscribe({
          next: (data) => {
            
            this.channels=data
            console.log("this.channels");
            console.log(this.channels);
            if (this.selectedChannel._id===this.channels["_id"]){
              
              console.log("fffff")
              console.log(this.selectedChannel._id);
              console.log(this.channels["_id"]);
              this.materials =this.channels["materials"];
            for (let i in this.materials){
               console.log(this.materials[i].type);

             // this.selectedMaterial=this.materials[i].type
            }
            
            
          }
            else{
              this.selectedChannel._id=this.channels["_id"]
            }
           
           
          },
          error: (err) => {
            this.errorMessage = err.error.message;
            
          },
        });
     }
     
    /* if (this.selectedChannel._id){
      for (let material of channel.materials){
       
       
       this.selectedMaterial=material
       // console.log(this.selectedMaterial)
      //  console.log("this.selectedMaterial")

      }
    }*/
      
  });
  }
  // ngOnChanges(changes: SimpleChanges) {
  //   if (this.initialMaterial) {
  //     this.selectedMaterial = this.initialMaterial;
  //     if (this.channel) {
  //       this.index = this.channel?.materials.indexOf(this.selectedMaterial);
  //     }
  //    // this.updateSelectedVideo();
  //   } else {
  //     this.setSelectedTabIndex(0);
  //   }
  // }

  /*addTab() {
this.tabs.push('New');
  //  this.tabtitle = '';
  }

  removeTab(index: number) {
    this.tabs.splice(index, 1);
  }*/
  onTabChange(e) {
    this.setSelectedTabIndex(e.index || 0);
    console.log("material ID")
    console.log(this.channels["materials"])
    //this.channel?.["materials"]
    this.selectedMaterial = this.channels["materials"][e.index || 0];
    console.log("material ID22222")
    console.log(this.selectedMaterial._id)
   
 }
 setSelectedTabIndex(index: number) {
  this.selectedMaterial = this.channels["materials"][index];
  console.log("this.selectedMaterial.type")
  console.log(this.selectedMaterial)
  this.updateSelectedMaterial();
}
updateSelectedMaterial() {
  if (!this.selectedMaterial) return;


  switch (this.selectedMaterial.type) {

    case "pdf":
      this.pdfViewService.setPageNumber(1)
      let url=this.selectedMaterial?.url+this.selectedMaterial?._id+".pdf"
      this.pdfViewService.setPdfURL(url)
      break;

    default:
  }
}
showNewMaterialModal() {
  this.isNewMaterialModalVisible = true;
}
closeNewMaterialModal(){
  this.isNewMaterialModalVisible = false;
  this.materialCreated.emit();
}

}
