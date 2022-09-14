import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Topic } from 'src/app/models/Topic';
import { TopicImp } from 'src/app/models/TopicImp';
import { CourseService } from 'src/app/services/course.service';
import { Course } from 'src/app/models/Course';
import { Channel } from 'src/app/models/Channel';

@Component({
  selector: 'app-add-topic',
  templateUrl: './add-topic.component.html',
  styleUrls: ['./add-topic.component.css']
})
export class AddTopicComponent implements OnInit {
  displayAddTopicDialogue: boolean = false;
  createTopicForm: FormGroup;
  @Input() onShowAddTopicDialogue = new EventEmitter<boolean>();


  constructor( private topicChannelService: TopicChannelService, private courseService: CourseService) {  }

  ngOnInit(): void {
    this.onShowAddTopicDialogue.subscribe((val) => this.toggleAddTopicDialogue());
    this.createTopicForm = new FormGroup({
      name: new FormControl(null, Validators.required)
  });
  }

  toggleAddTopicDialogue(){
    this.deleteLocalData();
    this.displayAddTopicDialogue = !this.displayAddTopicDialogue;
  }

  deleteLocalData(){
    this.ngOnInit();
  }

  onSubmit(){
    if (this.createTopicForm.valid) {
      const newTopic: Topic = new TopicImp(this.createTopicForm.value.name, '', '', []);
      const selectedCourse : Course = this.courseService.getSelectedCourse();
      this.topicChannelService.addTopic(newTopic, selectedCourse)
      this.toggleAddTopicDialogue();
    }
  }

}
