import { Component, OnInit } from '@angular/core';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';

@Component({
  selector: 'app-material',
  templateUrl: './material.component.html',
  styleUrls: ['./material.component.css']
})
export class MaterialComponent implements OnInit {
  selectedChannel: Channel
  constructor(private topicChannelService: TopicChannelService,) { }

  ngOnInit(): void {
    this.topicChannelService.onSelectChannel.subscribe((channel) => {
      this.selectedChannel = channel;
      alert(`onChannelSelect ${channel._id}`);
  });
  }
}
