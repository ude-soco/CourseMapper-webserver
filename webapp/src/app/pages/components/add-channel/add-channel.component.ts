import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Channel } from 'src/app/models/Channel';
import { ChannelImp } from 'src/app/models/ChannelImp';
import { Topic } from 'src/app/models/Topic';
import { TopicChannelService } from 'src/app/services/topic-channel.service';

@Component({
  selector: 'app-add-channel',
  templateUrl: './add-channel.component.html',
  styleUrls: ['./add-channel.component.css']
})
export class AddChannelComponent implements OnInit {

  displayAddChannelDialogue: boolean = false;
  createChannelForm: FormGroup;
  @Input() onShowAddChannelDialogue = new EventEmitter<boolean>();

  constructor(private topicChannelService: TopicChannelService) { }

  ngOnInit(): void {
    this.onShowAddChannelDialogue.subscribe((val) => this.toggleAddChannelDialogue());
    this.createChannelForm = new FormGroup({
      	name: new FormControl(null, Validators.required),
        description: new FormControl(null)
    });
  }
  toggleAddChannelDialogue(){
    this.deleteLocalData();
    this.displayAddChannelDialogue = !this.displayAddChannelDialogue;
  }

  deleteLocalData(){
    this.ngOnInit();
  }

  onSubmit(){
    if (this.createChannelForm.valid) {      
      const selectedTopic : Topic = this.topicChannelService.getSelectedTopic();
      const newChannel: Channel = new ChannelImp(this.createChannelForm.value.name, '', selectedTopic._id, selectedTopic.courseId, this.createChannelForm.value.description);
      this.topicChannelService.addChannel(newChannel);
      this.toggleAddChannelDialogue();
    }
  }
}
