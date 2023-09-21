import {
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  Validators,
  ValidatorFn,
  ValidationErrors,
} from '@angular/forms';
import { Subscription } from 'rxjs';
import {
  Material,
  CreateMaterial,
  MaterialType,
} from 'src/app/models/Material';
import { MaterilasService } from 'src/app/services/materials.service';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { Router } from '@angular/router';
import { MaterialComponent } from '../material/material.component';
import { ConfirmationService, MessageService } from 'primeng/api';

@Component({
  selector: 'app-add-material',
  templateUrl: './add-material.component.html',
  styleUrls: ['./add-material.component.css'],
  providers: [MessageService, ConfirmationService],
})
export class AddMaterialComponent implements OnInit {
  @Input() public channelEmittd: any;

  selectedChannel: Channel;
  @Input() courseID?: string;
  @Input() topicID?: string;
  @Input() channelID?: string;

  materialType: string = '';
  materialId: Material;
  materialComponent = MaterialComponent;
  pdfAddModelDisplay: boolean = false;
  videoAddModelDisplay: boolean = false;
  isFileSelectedInvalid: boolean = true;
  invalidPDFFileMessage: string = 'No File Chosen';
  pdfAttachButtonText = 'Attach a PDF';
  chosenFile = null;
  urlOrFile = 'urlOption';
  videoAttachButtonText = 'Attach a video';
  invalidVideoFileMessage: string = 'No File Chosen';
  materialToAdd: CreateMaterial = {
    name: '',
    type: 'pdf',
    courseId: '',
    topicId: '',
    channelId: '',
    url: '',

    description: '',
  };

  showPdfAddModel() {
    this.pdfAddModelDisplay = true;
    this.materialType = 'pdf';
  }
  showVideoAddModel() {
    this.videoAddModelDisplay = true;
    this.materialType = 'video';
  }

  formData: FormData = null;
  validateForm: FormGroup;
  channelName: string = '';

  response: any;

  radioFormGroup: FormGroup;
  validUrl: ValidatorFn = (control) => {
    let validUrl = true;
    /*     try {
      new URL(control.value);
    } catch {
      validUrl = false;
    } */
    let term = control.value;
    const regExp = new RegExp(
      '(?:https?://)?(?:www.)?(?:youtube.com|youtu.be)/(?:watch?(?=.*v=[w-]+)|([w-]+))'
    );
    const regexYouTubeSharedLink =
      /^https?:\/\/(?:www\.)?youtu\.be\/([\w-]{11})$/;
    const regexYoutubeSharedLinkWithTime =
      /^https?:\/\/(?:www\.)?youtu\.be\/([\w-]{11})(?:\?t=\d+)?$/;

    if (
      !regExp.test(term) &&
      !regexYouTubeSharedLink.test(term) &&
      !regexYoutubeSharedLinkWithTime.test(term)
    ) {
      validUrl = false;
    }

    return validUrl ? null : { invalidUrl: true };
  };
  urlFormControl = new FormControl('', [Validators.required, this.validUrl]);

  constructor(
    private formBuilder: FormBuilder,
    private fb: FormBuilder,
    private materialService: MaterilasService,
    private topicChannelService: TopicChannelService,
    private router: Router,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      materialName: ['', [Validators.required]],
      description: [''],
      url: [''],
    });

    this.radioFormGroup = new FormGroup({
      videoRadio: new FormControl('urlOption'),
    });
    this.radioFormGroup.valueChanges.subscribe((val) => {
      this.urlOrFile = val.videoRadio;
      if (val.videoRadio === 'urlOption') {
        this.invalidVideoFileMessage = 'Please enter a URL';
      } else {
        this.invalidVideoFileMessage = 'No File Chosen';
      }
      this.resetDialogs();
    });
  }

  //this method basically makes the input boxes red only after the submit button is pressed
  validateFields() {
    if (!this.chosenFile && this.materialType === 'pdf') {
      this.invalidPDFFileMessage = 'Please choose a PDF file';
    }
    Object.keys(this.validateForm.controls).forEach((field) => {
      const control = this.validateForm.get(field);
      control.markAsTouched({ onlySelf: true });
    });
  }

  submitForm(): void {
    if (this.materialType === 'pdf') {
      if (this.chosenFile === null) {
        return;
      }
      this.validateFields();
      this.pdfAddModelDisplay = false;
    }

    if (this.materialType === 'video') {
      this.validateFields();
      this.videoAddModelDisplay = false;
    }
    let file = this.chosenFile;
    this.materialToAdd.courseId = this.courseID!;
    this.materialToAdd.topicId = this.topicID!;
    this.materialToAdd.channelId = this.channelID!;
    this.materialToAdd.type = this.materialType as MaterialType;
    this.materialToAdd.name = this.validateForm.controls['materialName'].value;
    this.materialToAdd.description =
      this.validateForm.controls['description'].value;
    if (this.materialType == 'video') {
      if (this.urlFormControl.value) {
        this.materialToAdd.url = this.urlFormControl.value;
      } else {
        this.materialToAdd.url = '';
      }
    } else if (this.materialType == 'pdf') {
      this.materialToAdd.url = '/public/uploads/pdfs/';
    }

    var result = this.materialService
      .addMaterial(this.materialToAdd)
      .subscribe({
        next: (data) => {
          this.materialId = data.material._id;
          if (file) {
            if (this.materialType == 'video') {
              this.formData = new FormData();
              this.formData.append('file', file, data.material._id + '.mp4');
            }

            if (this.materialType == 'pdf') {
              this.formData = new FormData();
              this.formData.append('file', file, data.material._id + '.pdf');
            }

            this.materialService
              .uploadFile(this.formData, this.materialType)
              .subscribe(
                (res) => {
                  if (res.message === 'File uploaded successfully!') {
                    this.response = res;

                    this.resetDialogs();

                    this.validateForm.reset();

                    this.topicChannelService.selectChannel(this.channelEmittd);
                    this.router.navigate([
                      'course',
                      data.material.courseId,
                      'channel',
                      data.material.channelId,
                    ]);

                    //  this.reloadCurrentRoute()
                    this.showInfo('Material successfully added!');
                  }
                },
                (er) => {
                  console.log(er);
                  alert(er.error.error);
                  this.showError('Please make sure to add a valid file!');
                }
              );
          } else if (!file) {
            // this.materialemit=data.material._id
            //console.log(this.materialemit)
            this.validateForm.reset();
            this.topicChannelService.selectChannel(this.channelEmittd);
            /* this.validateForm['url'].setValue = ''; */
          }
        },
      });
    if (result != null) {
    }
  }

  myUploader(event) {
    this.chosenFile = event.currentFiles[0];

    if (this.materialType === 'pdf') {
      if (this.chosenFile.type !== 'application/pdf') {
        this.isFileSelectedInvalid = true;
        this.invalidPDFFileMessage = 'Please upload a PDF File';
      } else {
        this.isFileSelectedInvalid = false;
        this.invalidPDFFileMessage = '';
        this.pdfAttachButtonText = this.chosenFile.name;
      }
      return;
    }

    if (this.materialType === 'video') {
      this.isFileSelectedInvalid = false;
      this.invalidVideoFileMessage = '';
      this.videoAttachButtonText = this.chosenFile.name;
    }
  }

  resetDialogs(event?) {
    Object.keys(this.validateForm.controls).forEach((field) => {
      const control = this.validateForm.get(field);
      control.markAsUntouched({ onlySelf: true });
    });
    this.urlFormControl.reset();
    this.validateForm.reset();
    this.chosenFile = null;
    this.invalidPDFFileMessage = 'No File Chosen';
    this.pdfAttachButtonText = 'Select a PDF';
    this.videoAttachButtonText = 'Select a video';
    this.isFileSelectedInvalid = true;
  }
  /**
   * @function showInfo
   * shows the user if his action succeeded
   *
   */
  showInfo(msg) {
    this.messageService.add({
      severity: 'info',
      summary: 'Success',
      detail: msg,
    });
  }
  /**
   * @function showError
   * shows the user if his action failed
   *
   */
  showError(msg) {
    this.messageService.add({
      severity: 'error',
      summary: 'Error',
      detail: msg,
    });
  }

  /**
   * @function informUser
   * inform user about the result of his action
   *
   */
  informUser(severity, summary, detail) {
    this.messageService.add({
      severity: severity,
      summary: summary,
      detail: detail,
    });
  }
}
