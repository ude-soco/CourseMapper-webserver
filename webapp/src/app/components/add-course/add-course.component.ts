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
import { MaterilasService } from 'src/app/services/materials.service';

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
  selectedFileName: string = ''; // Holds the name of the uploaded file
  chosenFile = null;

  constructor(
    private courseService: CourseService,
    private materialService: MaterilasService,
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

  // Handle file selection
  onFileSelect(event: any): void {
    console.log('Upload succeeded with event: ');

    const file = event.files[0];

    // Validate file type
    if (!this.isValidImage(file)) {
      this.messageService.add({
        severity: 'error',
        summary: 'Invalid File',
        detail:
          'Please upload image files only with the extensions .jpg, .jpeg, and .png',
      });
      return;
    }

    // Set the selected file
    this.selectedFileName = file.name;
    this.chosenFile = file;

    // Display the image preview
    const reader = new FileReader();
    reader.onload = (e: any) => {
      //this.currentImage = e.target.result;
    };
    reader.readAsDataURL(file);

    this.showInfo('Image uploaded successfully');
  }

  // Handle file removal
  onFileRemove(event: any): void {
    this.selectedFileName = '';
    //this.currentImage = this.defaultImage;
    this.chosenFile = null;
    this.showInfo('Image removed successfully');
  }

  // Validate file type
  private isValidImage(file: File): boolean {
    console.log('Validating file type');
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const fileExtension = file.name
      .slice(file.name.lastIndexOf('.'))
      .toLowerCase();
    return validExtensions.includes(fileExtension);
  }


  setCourseIamge(course: Course): string {
    if (this.chosenFile) {
      // Resize the image to the fixed dimensions (536x354) before uploading
      const fileExtension = this.selectedFileName.split('.').pop(); // Extract file extension
      const newFileName = `${course._id}.${fileExtension}`; // Create new file name
      course.url = '/public/uploads/images/' + newFileName;

      //console.log('Resizing and uploading file with the name: ' + newFileName);

      const image = new Image();
      const reader = new FileReader();

      // Read the chosen file
      reader.onload = (e: any) => {
        image.src = e.target.result; // Set the image source to the file data
        image.onload = () => {
          // Create a canvas to resize the image
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;
          canvas.width = 536; // Set fixed width
          canvas.height = 354; // Set fixed height

          // Draw the resized image on the canvas
          ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

          // Convert the canvas to a Blob
          canvas.toBlob((blob) => {
            if (blob) {
              const resizedFile = new File([blob], newFileName, {
                type: this.chosenFile.type,
              });

              let formData = new FormData();
              formData.append('file', resizedFile, newFileName);

              this.materialService.uploadFile(formData, 'img').subscribe(
                (res) => {
                  console.log('response from image upload', res);
                  this.courseService
                    .updateCourse(course)
                    .subscribe((res: any) => {});
                },
                (er) => {
                  console.log(er);
                }
              );
            }
          }, this.chosenFile.type);
        };
      };

      // Start reading the file
      reader.readAsDataURL(this.chosenFile);

      return newFileName;
    } else {
      // If no file is uploaded, fetch and upload a random image
      return '/assets/img/courseDefaultImage.png';
    }
  }

  onSubmit() {
    if (this.createCourseForm.valid) {
      let newCourse: Course = new CourseImp(
        '',
        this.createCourseForm.value.name,
        this.createCourseForm.value.shortname,
        this.createCourseForm.value.description
      );

      this.toggleAddCourseDialogue();


      this.courseService.addCourse(newCourse).subscribe((res: any) => {
        if ('success' in res) {
          this.showInfo('Course successfully added!');
          this.setCourseIamge(res.courseSaved);
        } else {
          this.showError(res.errorMsg);
        }
      });
    }
  }

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
