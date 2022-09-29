import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
} from '@angular/forms';
import { Router } from '@angular/router';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CourseService } from 'src/app/services/course.service';
import { Course, CreateCourse } from 'src/assets/data/Course';

@Component({
  selector: 'app-add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.scss'],
})
export class AddCourseComponent implements OnInit {
  validateForm: FormGroup;
  courseObj: CreateCourse = {
    course: '',
    shortName: '',
    userID: '',
    createdAt: 0,
    updatedAt: 0,
    lessons: [],
    description: '',
  };

  topicForm!: FormGroup;

  listOfControl: Array<{ id: number; controlInstance: string }> = [];
  @Output() onSubmitted: EventEmitter<void> = new EventEmitter();
  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private message: NzMessageService
  ) {
    this.validateForm = this.fb.group({
      courseName: ['', [Validators.required]],
      shortcut: ['', [Validators.required]],
      description: [''],
    });
  }

  ngOnInit(): void {}

  //add a course
  resetForm(e: MouseEvent): void {
    e.preventDefault();
    this.validateForm.reset();
    for (const key in this.validateForm.controls) {
      if (this.validateForm.controls.hasOwnProperty(key)) {
        this.validateForm.controls[key].markAsPristine();
        this.validateForm.controls[key].updateValueAndValidity();
      }
    }
  }
  async submitForm(): Promise<void> {
    this.courseObj.course = this.validateForm.controls['courseName'].value;
    this.courseObj.shortName = this.validateForm.controls['shortcut'].value;
    this.courseObj.description =
      this.validateForm.controls['description'].value;
    var res = await this.courseService.addCourse(this.courseObj);
    if (res != null) {
      this.message.success(
        `
        <br>
        Course has been successfully created!
        <br>
         `,
        {
          nzDuration: 10000,
        }
      );
      this.onSubmitted.emit();
    }
  }
}
