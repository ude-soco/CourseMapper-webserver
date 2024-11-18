import {
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
  Renderer2,
} from '@angular/core';
import { CourseService } from 'src/app/services/course.service';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Course } from 'src/app/models/Course';
import { CourseImp } from 'src/app/models/CourseImp';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'app-add-course',
  templateUrl: './add-course.component.html',
  styleUrls: ['./add-course.component.css'],
  providers: [MessageService],
})
export class AddCourseComponent implements OnInit {
  @Input() displayAddCourseDialogue: boolean = false;
  @Output() onCloseAddCourseDialogue = new EventEmitter<boolean>();

  createCourseForm: FormGroup;

  constructor(
    private courseService: CourseService,
    private messageService: MessageService,
    private renderer: Renderer2
  ) {}

  ngOnInit(): void {
    this.createCourseForm = new FormGroup({
      name: new FormControl(null, Validators.required),
      shortname: new FormControl(null),
      description: new FormControl(null),
    });
  }

  onSubmit() {
    if (this.createCourseForm.valid) {
      let newCourse: Course = new CourseImp(
        '',
        this.createCourseForm.value.name,
        this.createCourseForm.value.shortname,
        this.createCourseForm.value.description
      );
      this.courseService.addCourse(newCourse).subscribe((res: any) => {
        if ('success' in res) {
          this.toggleAddCourseDialogue();
          // this.showInfo(res.success);
          this.showInfo('Course successfully added!');
        } else {
          this.showError(res.errorMsg);
        }
      });
    }
  }""

  toggleAddCourseDialogue() {
    this.displayAddCourseDialogue = !this.displayAddCourseDialogue;
    this.onCloseAddCourseDialogue.emit(this.displayAddCourseDialogue);
    this.deleteLocalData();
  }

  deleteLocalData() {
    this.ngOnInit();
  }

  showInfo(msg) {
    this.messageService.add({
      severity: 'success',
      summary: 'Success',
      detail: msg,
    });
  }

  showError(msg) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: msg,
    });
  }
  preventEnterKey(e) {
    let confirmButton = document.getElementById('addCourseConfirm');
    if (e.keyCode === 13) {
      e.preventDefault();
      this.renderer.addClass(confirmButton, 'confirmViaEnter');
      setTimeout(() => {
        this.renderer.removeClass(confirmButton, 'confirmViaEnter');
      }, 150);
    }
  }
}
