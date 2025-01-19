import {
  Component,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Observable } from 'rxjs';
import { Course } from '../models/Course';
import { CourseImp } from '../models/CourseImp';
import { ConfirmationService, MessageService } from 'primeng/api';
import { CourseService } from '../services/course.service';
import { Store, on } from '@ngrx/store';
import {
  getCourseSelected,
  getShowPopupMessage,
  State,
} from 'src/app/state/app.reducer';
import * as CourseAction from 'src/app/pages/courses/state/course.actions';
import { ActivatedRoute, Router } from '@angular/router';
import {
  getChannelSelected,
  getCurrentCourseId,
} from '../pages/courses/state/course.reducer';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { UserServiceService } from '../services/user-service.service';
import * as AppActions from '../state/app.actions';
import * as NotificationActions from '../pages/components/notifications/state/notifications.actions';
import { IndicatorService } from '../services/indicator.service';
import { Indicator } from '../models/Indicator';
import { ShowInfoError } from '../_helpers/show-info-error';
import { Socket } from 'ngx-socket-io';
import { environment } from 'src/environments/environment';
import Quill from 'quill';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Console } from 'console';
import { MaterilasService } from '../services/materials.service';
@Component({
  selector: 'app-course-welcome',
  templateUrl: './course-welcome.component.html',
  styleUrls: ['./course-welcome.component.css'],
  providers: [MessageService, ConfirmationService, DatePipe],
})
export class CourseWelcomeComponent implements OnInit {
  selectedCourse: Course = new CourseImp('', '');
  courseSelected$: Observable<boolean>;
  channelSelected$: Observable<boolean>;
  tagSelected$: Observable<boolean>;
  userArray: any = new Array();
  moderator: boolean = false;
  createdAt: string;
  firstName: string;
  lastName: string;
  Users: any;
  role: string;
  selectedCourseId: string = '';
  private API_URL = environment.API_URL;

  showInfoError: ShowInfoError;
  isEditingName: boolean = false;
  isEditingDescription: boolean = false;
  isEditingImage: boolean = false;
  isEditing: boolean = false;

  courseName: string = '';
  courseDescription: string = '';
  sanitizedDescription: SafeHtml;

  selectedFileName: string = ''; // Holds the name of the uploaded file
  chosenFile = null;
  private imageTimestamp: number = new Date().getTime();

  public editMode: boolean = false;

  constructor(
    private confirmationService: ConfirmationService,
    private renderer: Renderer2,
    protected courseService: CourseService,
    private store: Store<State>,
    private router: Router,
    private indicatorService: IndicatorService,
    private messageService: MessageService,
    private topicChannelService: TopicChannelService,
    private userService: UserServiceService,
    private socket: Socket,
    private sanitizer: DomSanitizer,
    private materialService: MaterilasService,
    private route: ActivatedRoute
  ) {
    this.courseSelected$ = store.select(getCourseSelected);
    this.channelSelected$ = this.store.select(getChannelSelected);
  }

  ngOnInit(): void {
    this.selectedCourse = this.courseService.getSelectedCourse();
    this.Users = [];
    this.courseService.onSelectCourse.subscribe((course) => {
      this.selectedCourse = course;
      this.selectedCourseId = course._id;
      if (this.selectedCourse.role === 'moderator') {
        this.moderator = true;
        console.log('selected course', this.selectedCourse);

        // Subscribe to query parameters to get the 'edit' value
        this.route.queryParams.subscribe((params) => {
          this.editMode = params['edit'] === 'true'; // Set editMode to true if 'edit' is 'true'

          if (this.editMode) {
            this.toggleEdit('name'); // Edit the course name
            this.toggleEdit('description'); // Edit the description of the course
            this.toggleEdit('image'); // Edit the image of the course

           // Remove the 'edit' query parameter from the URL
            this.router.navigate([], {
              relativeTo: this.route, // Maintain the current route
              queryParams: { edit: null }, // Set 'edit' to null to remove it
              queryParamsHandling: 'merge', // Merge with existing query params
            });
          }
        });
      } else {
        this.moderator = false;
      }
      this.topicChannelService.fetchTopics(course._id).subscribe((res) => {
        this.selectedCourse = res.course;
        this.Users = course.users;
        // TODO: Bad implementation to get the moderator, i.e., course.users[0].userId
        this.buildCardInfo(course.users[0].userId, course);
      });

      this.sanitizeDescription();

      if (this.selectedCourse.role === 'moderator') {
        this.moderator = true;
      } else {
        this.moderator = false;
      }
    });
    if (this.selectedCourse._id !== '') {
      this.buildCardInfo(
        this.selectedCourse.users[0]?.userId,
        this.selectedCourse
      );
      if (this.selectedCourse.role === 'moderator') {
        this.moderator = true;
      } else {
        this.moderator = false;
      }
    }
  }

  sanitizeDescription(): void {
    this.sanitizedDescription = this.sanitizer.bypassSecurityTrustHtml(
      this.selectedCourse.description
    );
  }

  buildCardInfo(userModeratorID: string, course: Course) {
    this.userService.GetUserName(userModeratorID).subscribe((user) => {
      this.firstName = user.firstname;
      this.lastName = user.lastname;
      this.role = course.role;

      var index = course.createdAt.indexOf('T');
      (this.createdAt = course.createdAt.slice(0, index)),
        course.createdAt.slice(index + 1);
      let ingoPush = {
        id: course._id,
        name: course.name,
        shortName: course.shortName,
        createdAt: this.createdAt,
        firstName: this.firstName,
        lastName: this.lastName,
      };
      this.userArray.push(ingoPush);
    });
  }

  deEnrole() {
    this.confirmationService.confirm({
      message:
        'Are you sure you want to Unenroll from course "' +
        this.selectedCourse.name +
        '"?',
      header: 'Unenroll Confirmation',
      icon: 'pi pi-info-circle',
      accept: (e) => this.unEnrolleCourse(this.selectedCourse),

      reject: () => {
        // this.informUser('info', 'Cancelled', 'Deletion cancelled')
      },
    });
    setTimeout(() => {
      const rejectButton = document.getElementsByClassName(
        'p-confirm-dialog-reject'
      ) as HTMLCollectionOf<HTMLElement>;
      for (var i = 0; i < rejectButton.length; i++) {
        this.renderer.addClass(rejectButton[i], 'p-button-outlined');
      }
    }, 0);
  }

  toggleEdit(field: 'name' | 'description' | 'image') {
    this.isEditing = true;
    this.courseName = this.selectedCourse.name;
    this.courseDescription = this.selectedCourse.description;

    if (field === 'name') {
      this.isEditingName = true;
    }
    if (field === 'description') {
      this.isEditingDescription = true;
    }
    if (field === 'image') this.isEditingImage = true;

    // Copy current values to editable object
  }

  saveChanges() {
    // Apply changes from editableCourse to selectedCourse
    this.isEditing =
      this.isEditingName =
      this.isEditingDescription =
      this.isEditingImage =
        false;

    this.selectedCourse.name = this.courseName;
    this.selectedCourse.description = this.courseDescription;

    if (this.chosenFile) {
      let imageName = this.setCourseIamge(this.selectedCourse);
      this.selectedCourse.url = '/public/uploads/pdfs/' + imageName;
    } else {
      this.courseService
        .updateCourse(this.selectedCourse)
        .subscribe((res: any) => {});
    }
    // this.ngOnInit();
  }

  onEditorChange(event: any): void {
    // Get the current HTML content from the editor
    const updatedContent = event.htmlValue; // This captures the HTML content from the editor

    this.courseDescription = updatedContent;
  }

  cancelChanges() {
    this.courseName = this.selectedCourse.name;
    this.courseDescription = this.selectedCourse.description;

    // Discard changes
    this.isEditing =
      this.isEditingName =
      this.isEditingDescription =
      this.isEditingImage =
        false;
  }

  onImageChange(event: any) {
    const file = event.files[0];

    // Validate file type
    if (!this.isValidImage(file)) {
      this.showError(
        'Please upload image files only with the extensions .jpg, .jpeg, and .png'
      );
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

    this.showInfo('Image selected successfully');
  }

  setCourseIamge(course: Course): string {
    if (this.chosenFile) {
      // Resize the image to the fixed dimensions (536x354) before uploading
      const fileExtension = this.selectedFileName.split('.').pop(); // Extract file extension
      const newFileName = `${course._id}.${fileExtension}`; // Create new file name

      // console.log('Resizing and uploading file with the name: ' + newFileName);

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
                  // Update the course image URL in the database
                  this.courseService
                    .updateCourse(this.selectedCourse)
                    .subscribe((res: any) => {
                      this.refreshImageTimestamp();
                    });
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
      return null;
    }
  }

  // Handle file removal
  onFileRemove(event: any): void {
    this.selectedFileName = '';
    //this.currentImage = this.defaultImage;
    this.chosenFile = null;
    this.showInfo('Image removed successfully');
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

  // Validate file type
  private isValidImage(file: File): boolean {
    //console.log('Validating file type');
    const validExtensions = ['.jpg', '.jpeg', '.png'];
    const fileExtension = file.name
      .slice(file.name.lastIndexOf('.'))
      .toLowerCase();
    return validExtensions.includes(fileExtension);
  }

  getCourseImage(course: Course): string {
    if (course.url) {
      return `${this.API_URL}${course.url.replace(/\\/g, '/')}?t=${
        this.imageTimestamp
      }`;
    } else {
      return '/assets/img/courseDefaultImage.png';
    }
  }

  refreshImageTimestamp(): void {
    this.imageTimestamp = new Date().getTime();
  }

  getName(firstName: string, lastName: string) {
    let Name = firstName + ' ' + lastName;
    return Name.split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  }

  onEditorInit(event: any): void {
    // Access the TinyMCE editor instance
    const editorInstance = event.editor as Quill;

    editorInstance.clipboard.dangerouslyPasteHTML(
      this.selectedCourse.description
    );

    this.courseDescription = this.selectedCourse.description;
  }

  unEnrolleCourse(course: Course) {
    this.courseService.WithdrawFromCourse(course).subscribe((res) => {
      let showInfoError = new ShowInfoError(this.messageService);
      if ('success' in res) {
        // this.showInfoError.showInfo('You have been  withdrewed successfully ');
        // this.showInfo('You are successfully withdrew from the course');
        this.messageService.add({
          severity: 'success',
          summary: 'Success',
          detail: 'You are successfully withdrew from the course',
        });

        this.store.dispatch(
          CourseAction.setCurrentCourse({ selcetedCourse: course })
        );
        this.store.dispatch(CourseAction.setCourseId({ courseId: course._id }));
        this.socket.emit('leave', 'course:' + course._id);
        this.store.dispatch(
          NotificationActions.isDeletingCourse({ courseId: course._id })
        );
        // this.router.navigate(['course-description', course._id]);
        setTimeout(() => {
          this.router.navigate(['course-description', course._id]);
        }, 850);
      }
      (er) => {
        console.log(er);
        alert(er.error.error);
        this.showInfoError.showError('Please make sure to add a valid data!');
      };
    });
  }
}
