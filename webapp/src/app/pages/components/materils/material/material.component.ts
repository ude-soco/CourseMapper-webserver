import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { ElementRef, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';
import { Material } from 'src/app/models/Material';



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

  isNewMaterialModalVisible: boolean = false;
  errorMessage: any;
 // selectAfterAdding: boolean; 
  // tabs = [];
 // selected = new FormControl(0);
  //tabtitle:string = '';
  constructor(private topicChannelService: TopicChannelService,) { }

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
               console.log(this.materials[i].name);
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


  /*addTab() {
this.tabs.push('New');
  //  this.tabtitle = '';
  }

  removeTab(index: number) {
    this.tabs.splice(index, 1);
  }*/
  onTabChange(e) {
    this.setSelectedTabIndex(e.index || 0);
    this.selectedMaterial = this.channel?.materials[e.index || 0];
 }
 setSelectedTabIndex(index: number) {
  this.selectedMaterial = this.channel?.materials[index];
  //this.updateSelectedVideo();
}
showNewMaterialModal() {
  this.isNewMaterialModalVisible = true;
}

}
