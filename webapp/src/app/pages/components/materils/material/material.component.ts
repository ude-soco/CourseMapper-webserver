import { Component, OnInit } from '@angular/core';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import {COMMA, ENTER} from '@angular/cdk/keycodes';
import { ElementRef, ViewChild} from '@angular/core';
import {FormControl} from '@angular/forms';

@Component({
  selector: 'app-material',
  templateUrl: './material.component.html',
  styleUrls: ['./material.component.css']
})
export class MaterialComponent implements OnInit {

  selectedChannel: Channel;
  selectAfterAdding: boolean; 
   tabs = [];
  selected = new FormControl(0);
  tabtitle:string = '';
  constructor(private topicChannelService: TopicChannelService,) { }

  ngOnInit(): void {
    this.topicChannelService.onSelectChannel.subscribe((channel) => {
      this.selectedChannel = channel;
      alert(`onChannelSelect ${channel._id}`);
  });
  }


  addTab() {


       this.tabs.push('New');
    
   
  //  this.tabtitle = '';

   

  }

  removeTab(index: number) {
    this.tabs.splice(index, 1);
  }
}
