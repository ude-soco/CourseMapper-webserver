import { Component, EventEmitter, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { Channel } from 'src/app/models/Channel';
import { Topic } from 'src/app/models/Topic';
import { CourseService } from 'src/app/services/course.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';

@Component({
  selector: 'app-topic-dropdown',
  templateUrl: './topic-dropdown.component.html',
  styleUrls: ['./topic-dropdown.component.css'],
})
export class TopicDropdownComponent implements OnInit {
  constructor(private courseService: CourseService, private topicChannelService: TopicChannelService) {}
  topics: Topic[]= [];
  displayAddChannelDialogue: boolean = false;
  selectedTopic = null;
  selectedChannel = null;
  topicOptions: MenuItem[] = [
    {
        label: 'Options',
        items: [{
            label: 'Rename',
            icon: 'pi pi-refresh',
            command: () => this.onRenameTopic()
        },
        {
            label: 'Delete',
            icon: 'pi pi-times',
            command: () => this.onDeleteTopic()
        }
    ]}
  ];
  channelsOptions: MenuItem[] = [
    {
        label: 'Options',
        items: [{
            label: 'Rename',
            icon: 'pi pi-refresh',
            command: () => this.onRenameChannel()
        },
        {
            label: 'Delete',
            icon: 'pi pi-times',
            command: () => this.onDeleteChannel()
        }
    ]}
  ];

  ngOnInit(): void {
    this.topicChannelService.fetchTopics(this.courseService.getSelectedCourse()._id).subscribe((topics) => this.topics=topics);
    this.topicChannelService.onUpdateTopics$.subscribe((topics) => this.topics = topics);
  }

  showMenu() {
    console.log(this.selectedTopic);
  }

  onSelectTopic(topic: Topic){
    alert(`onTopicSelect ${topic._id}`);
  }
  onSelectChannel(channel: Channel){
    alert(`onChannelSelect ${channel._id}`);
  }
  
  onDeleteTopic(){
    alert(`${this.selectedTopic._id} onDeleteTopic`);
  }
  onRenameTopic(){
    alert(`${this.selectedTopic._id} onRenameTopic`);
  }
  onDeleteChannel(){
    alert(`${this.selectedChannel._id} onDeleteChannel`);
  }
  onRenameChannel(){
    alert(`${this.selectedChannel._id} onRenameChannel`);
  }

  onAddNewChannelClicked(topic:Topic){
    this.topicChannelService.selectTopic(topic);
    this.toggleAddNewChannelClicked(true);
  }

  toggleAddNewChannelClicked(visibility){
    this.displayAddChannelDialogue = visibility;
  }
}
