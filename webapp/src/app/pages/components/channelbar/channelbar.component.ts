import { TopicChannelService } from './../../../services/topic-channel.service';
import { CourseService } from './../../../services/course.service';
import { Component, EventEmitter, OnInit } from '@angular/core';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';
import { Channel } from 'src/app/models/Channel';
import { Topic } from 'src/app/models/Topic';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-channelbar',
  templateUrl: './channelbar.component.html',
  styleUrls: ['./channelbar.component.css'],
})
export class ChannelbarComponent implements OnInit {
  constructor( private courseService: CourseService, private topicChannelService: TopicChannelService) {}
  selectedCourse: Course = new CourseImp('','');
  displayAddTopicDialogue: boolean = false;
  onShowAddTopicDialogue = new EventEmitter<boolean>();

  options: MenuItem[] = [
    {
        label: 'Options',
        items: [{
            label: 'Rename',
            icon: 'pi pi-refresh',
            command: () => this.onRenameCourse()
        },
        {
            label: 'Delete',
            icon: 'pi pi-times',
            command: () => this.onDeleteCourse()
        }
    ]}
  ];
  ngOnInit(): void {
    this.selectedCourse = this.courseService.getSelectedCourse();        
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
    });    
  }

  onDeleteCourse() {
    this.courseService.deleteCourse(this.selectedCourse);
  }
  onRenameCourse() {
    alert('Rename Course');
  }

  onAddTopicDialogueClicked(){    
    this.onShowAddTopicDialogue.emit(!this.displayAddTopicDialogue);
  }
}
