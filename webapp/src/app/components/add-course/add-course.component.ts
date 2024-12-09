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

  fetchAndUploadRandomImage(courseID: string): string {
    const randomImgUrl = 'https://picsum.photos/536/354';
    const newFileName = `${courseID}.jpg`;

    // Fetch the random image as a Blob
    fetch(randomImgUrl)
      .then((response) => response.blob())
      .then((blob) => {
        // Create a new file name with the course ID

        // Prepare the FormData for upload
        let formData = new FormData();
        formData.append('file', blob, newFileName);

        // Upload the random image
        this.materialService.uploadFile(formData, 'img').subscribe(
          (res) => {
            if (res.message === 'Image uploaded successfully!') {
              this.showInfo('Random image successfully added!');
            }
          },
          (error) => {
            console.error(error);
            this.showError('Failed to upload the random image.');
          }
        );
      })
      .catch((error) => {
        console.error('Error fetching random image:', error);
        this.showError('Failed to fetch random image.');
      });

    return newFileName;
  }

  setCourseIamge(course: Course): string {
    if (this.chosenFile) {
      // If user uploaded a file, handle the file upload
      const fileExtension = this.selectedFileName.split('.').pop(); // Extract file extension
      const newFileName = `${course._id}.${fileExtension}`; // Create new file name

      console.log('Uploading file with the name: ' + newFileName);

      let formData = new FormData();
      formData.append('file', this.chosenFile, newFileName);

      this.materialService.uploadFile(formData, 'img').subscribe(
        (res) => {},
        (er) => {
          console.log(er);
        }
      );

      return newFileName;
    } else {
      // If no file is uploaded, fetch and upload a random image
      return this.fetchAndUploadRandomImage(course._id);
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

      this.courseService.addCourse(newCourse).subscribe((res: any) => {
        if ('success' in res) {
          let imageName = this.setCourseIamge(res.courseSaved);
          res.courseSaved.url = '/public/uploads/images/' + imageName;

          this.courseService
            .setImageCourse(res.courseSaved)
            .subscribe((res: any) => {
              if ('success' in res) {
                console.log('Course updated successfully');
              }
            });

          this.toggleAddCourseDialogue();
          this.showInfo('Course successfully added!');
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
