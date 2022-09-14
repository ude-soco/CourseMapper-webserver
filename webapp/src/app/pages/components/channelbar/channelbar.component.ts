import { Topic } from './../../../models/Topic';
import { CourseService } from 'src/app/services/course.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { Component, EventEmitter, OnInit } from '@angular/core';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';
import { Channel } from 'src/app/models/Channel';

@Component({
  selector: 'app-channelbar',
  templateUrl: './channelbar.component.html',
  styleUrls: ['./channelbar.component.css'],
})
export class ChannelbarComponent implements OnInit {
  constructor( private courseService: CourseService, private topicChannelService: TopicChannelService) {}
  selectedCourse: Course = new CourseImp('','');
  topics: Topic[]= [];
  displayAddTopicDialogue: boolean = false;
  onShowAddTopicDialogue = new EventEmitter<boolean>();
  displayAddChannelDialogue: boolean = false;
  onShowAddChannelDialogue = new EventEmitter<boolean>();

  ngOnInit(): void {
    this.selectedCourse = this.courseService.getSelectedCourse();        
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
    });    
    this.topicChannelService.fetchTopics(this.selectedCourse._id).subscribe((topics) => this.topics=topics);
    this.topicChannelService.onUpdateTopics$.subscribe((topics) => this.topics = topics);
  }

  onDeleteCourse() {
    this.courseService.deleteCourse(this.selectedCourse);
  }
  onSelectTopic(topic: Topic){
    alert('onTopicSelect')
  }
  onSelectChannel(channel: Channel){
    alert('onChannelSelect')
  }
  onSelectChannelOption(action: string, id: string){
    if (action === 'Delete'){
      this.onDeleteChannel(id);
    }else{
      this.onRenameChannel(id);
    }
  }

  onSelectTopicOption(action: string, id: string){
    if (action === 'Delete'){
      this.onDeleteTopic(id);
    }else{
      this.onRenameTopic(id);
    }
  }

  onDeleteTopic(id: string){
    alert(`${id} onDeleteTopic`)
  }
  onRenameTopic(id: string){
    alert(`${id} onRenameTopic`)
  }
  onDeleteChannel(id: string){
    alert(`${id} onDeleteChannel`)
  }
  onRenameChannel(id: string){
    alert(`${id} onRenameChannel`)
  }

  onAddNewChannelClicked(topic:Topic){
    this.topicChannelService.selectTopic(topic);
    this.onShowAddChannelDialogue.emit(!this.displayAddChannelDialogue);
  }
  onAddTopicDialogueClicked(){    
    this.onShowAddTopicDialogue.emit(!this.displayAddTopicDialogue);
  }
}
