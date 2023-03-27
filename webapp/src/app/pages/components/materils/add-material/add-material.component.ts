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
  // @Output() public materialemit = new EventEmitter<any>();

  @Input() public channelEmittd: any;
  @ViewChild('UploadFileInput', { static: false }) uploadFileInput:
    | ElementRef
    | undefined;
  selectedChannel: Channel;
  @Input() courseID?: string;
  @Input() topicID?: string;
  @Input() channelID?: string;
  @Output() onSubmitted: EventEmitter<void> = new EventEmitter();
  materialType: string = '';
  materialId: Material;
  materialComponent = MaterialComponent;

  materialToAdd: CreateMaterial = {
    name: '',
    type: 'pdf',
    courseID: '',
    topicID: '',
    channelID: '',
    url: '',

    description: '',
  };
  formData: FormData = null;
  validateForm: FormGroup;
  channelName: string = '';
  subs = new Subscription();
  response: any;
  fileUploadForm: FormGroup | undefined;
  fileInputLabel: string | undefined;

  file: File = null;
  constructor(
    private formBuilder: FormBuilder,
    private fb: FormBuilder,
    private materialService: MaterilasService,
    private topicChannelService: TopicChannelService,
    private router: Router,
    private messageService: MessageService,
  ) {}

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      materialName: ['', [Validators.required]],
      url: [''],
      description: [''],
    });
    this.fileUploadForm = this.formBuilder.group({
      file: [null],
    });
    //customValidator(this.validateForm.get("url").value, this.fileUploadForm.get("file").value);
  }

  videoTab() {
    this.materialType = 'video';
    console.log(this.materialType);
  }
  pdfTab() {
    this.materialType = 'pdf';
    console.log(this.materialType);
  }

  onFileSelect(event) {
    this.file = <File>event.target.files[0];
    this.fileInputLabel = this.file['name'];
    const fileChosen = document.getElementById('file-chosen');
    fileChosen!.textContent = this.fileInputLabel;
    this.fileUploadForm?.get('file')?.setValue(this.file);
    event.target.value = '';
  }

  submitForm(): void {
    var file = this.fileUploadForm?.get('file')?.value;
    this.materialToAdd.courseID = this.courseID!;
    this.materialToAdd.topicID = this.topicID!;
    this.materialToAdd.channelID = this.channelID!;
    this.materialToAdd.type = this.materialType as MaterialType;
    this.materialToAdd.name = this.validateForm.controls['materialName'].value;
    this.materialToAdd.description =
      this.validateForm.controls['description'].value;
    if (this.materialType == 'video') {
      if (this.validateForm.controls['url'].value) {
        this.materialToAdd.url = this.validateForm.controls['url'].value;
      } else {
        this.materialToAdd.url = '';
      }
    } else if (this.materialType == 'pdf') {
      //this.API_URL + "/public/uploads/pdfs/"+this.materialId+".pdf"
      this.materialToAdd.url = '/public/uploads/pdfs/';
    }

    console.log('this.materialToAdd');
    console.log(this.materialToAdd);
    var result = this.materialService
      .addMaterial(this.materialToAdd)
      .subscribe({
        next: (data) => {
          this.materialId = data.material._id;
          if (file) {
            if (this.materialType == 'video') {
              this.formData = new FormData();
              this.formData.append(
                'file',
                this.file,
                data.material._id + '.mp4'
              );
            }

            if (this.materialType == 'pdf') {
              this.formData = new FormData();
              this.formData.append(
                'file',
                this.file,
                data.material._id + '.pdf'
              );
            }

            this.materialService
              .uploadFile(this.formData, this.materialType)
              .subscribe(
                (res) => {
                  if (res.message === 'File uploaded successfully!') {
                    this.response = res;
                    this.fileUploadForm.reset();

                    const fileChosen = document.getElementById('file-chosen');
                    fileChosen!.textContent = '';
                    let file = document.getElementById('file');
                    file!.textContent = '';
                    this.fileUploadForm?.get('file')?.setValue(null);

                    console.log('materialemit');
                    // this.materialemit=data.material._id
                    //console.log(this.materialemit)
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
                  this.showError('Please make sure to add a valid file!')
                }
              );
          } else if (!file) {
            console.log('materialemit without file');
            // this.materialemit=data.material._id
            //console.log(this.materialemit)
            this.validateForm.reset();

            this.topicChannelService.selectChannel(this.channelEmittd);
            this.validateForm['url'].setValue = '';
          }
        },
      });
    if (result != null) {
      this.fileUploadForm.reset();
      //window.location.reload()
      //  "['artist', track.artistId]"
      // this.router.navigate(['course', this.channelID])
      // this.router.navigate(['course', this.courseID,'channel', this.channelID, 'material',this.materialId ])
      // this.router.navigate(['course', this.courseID])
      console.log(result);
      // this.onSubmitted.emit();
    }
  }
  // reset(){
  //   this.file=null
  //   this.uploadFileInput=null
  //   var fileee= this.fileUploadForm?.get('file')?.value
  //   console.log("fileee")
  //   console.log(fileee)

  // }
  reloadCurrentRoute() {
    let currentUrl = this.router.url;
    this.router.navigateByUrl('/', { skipLocationChange: true }).then(() => {
      this.router.navigate([currentUrl]);
    });
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
     informUser(severity, summary, detail){
      this.messageService.add({
        severity: severity,
        summary: summary,
        detail: detail,
      });
    }
}
