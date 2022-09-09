import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CourseService } from 'src/app/services/course.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';

@Component({
  selector: 'app-add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.css']
})
export class AddCourseComponent implements OnInit {

  displayAddCourseDialogue: boolean = false;
  createCourseForm: FormGroup;

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
        shortname: new FormControl(null),
        description: new FormControl(null)
    });
  }

  

  onSubmit(){ 
    if (this.createCourseForm.valid) {
      let newCourse: Course = new CourseImp('3242343252', 
                                    this.createCourseForm.value.name, 
                                    this.createCourseForm.value.shortname,
                                    this.createCourseForm.value.description);   
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
