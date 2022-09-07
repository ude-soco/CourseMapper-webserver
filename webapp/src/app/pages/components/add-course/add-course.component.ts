import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CourseService } from 'src/app/services/course.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Course } from 'src/app/models/Course';

@Component({
  selector: 'app-add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.css']
})
export class AddCourseComponent implements OnInit {

  displayAddCourseDialogue: boolean = false;
  createCourseForm!: FormGroup;

  /**
    * used to get notified once the user
    * click on the add course icon in 
    * the parent component
  **/
  @Input() onShowAddCourseDialogue = new EventEmitter<boolean>();

  constructor(private courseService: CourseService) { }

  ngOnInit(): void {
    this.onShowAddCourseDialogue.subscribe((val) => this.toggleAddCourseDialogue());
    this.createCourseForm = new FormGroup({
      	name: new FormControl(null, Validators.required),
        shortname: new FormControl(null, Validators.required),
        description: new FormControl(null, Validators.required)
    });
  }

  

  onSubmit(){ 
    if (this.createCourseForm.valid) {
      let newCourse: Course = {
        _id: '',
        name: this.createCourseForm.value.name,
        shortName: this.createCourseForm.value.shortname,
        description: this.createCourseForm.value.description,
        numberTopics: 0,
        notification: 0,
        numberChannels: 0,
        numberUsers: 0
      }
      this.courseService.addCourse(newCourse);      
      this.toggleAddCourseDialogue();
    }
  }

  toggleAddCourseDialogue(){
    this.deleteLocalData();
    this.displayAddCourseDialogue = !this.displayAddCourseDialogue;
  }

  deleteLocalData(){
    this.ngOnInit();
  }

}
