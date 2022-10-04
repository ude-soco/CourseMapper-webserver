import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { Component, EventEmitter, Input, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Topic } from 'src/app/models/Topic';
import { TopicImp } from 'src/app/models/TopicImp';
import { CourseService } from 'src/app/services/course.service';
import { Course } from 'src/app/models/Course';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-add-topic',
  templateUrl: './add-topic.component.html',
  styleUrls: ['./add-topic.component.css'],
  providers: [MessageService]
})
export class AddTopicComponent implements OnInit {
  displayAddTopicDialogue: boolean = false;
  createTopicForm: FormGroup;
  @Input() onShowAddTopicDialogue = new EventEmitter<boolean>();


  constructor( private topicChannelService: TopicChannelService, private courseService: CourseService, private messageService: MessageService ) {  }

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
      const selectedCourse : Course = this.courseService.getSelectedCourse();
      const newTopic: Topic = new TopicImp(this.createTopicForm.value.name, '', selectedCourse._id, []);
      this.topicChannelService.addTopic(newTopic, selectedCourse).subscribe(res => {
        if ('success' in res) {
          this.toggleAddTopicDialogue();
          this.showInfo(res.success);
        }else {
          this.showError(res.errorMsg);
        }
      });
    }
  }

  showInfo(msg) {
    this.messageService.add({severity:'info', summary: 'Success', detail: msg});
  }
  showError(msg) {
    this.messageService.add({severity:'error', summary: 'Error', detail: msg});
  }

}
