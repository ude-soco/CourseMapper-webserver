import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Material, CreateMaterial, MaterialType } from 'src/app/models/Material';
import { MaterilasService } from 'src/app/services/materials.service';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { Router } from '@angular/router';
import { MaterialComponent } from '../material/material.component';
import { MessageService } from 'primeng/api';



@Component({
  selector: 'app-add-material',
  templateUrl: './add-material.component.html',
  styleUrls: ['./add-material.component.css']
})
export class AddMaterialComponent implements OnInit {
  // @Output() public materialemit = new EventEmitter<any>();

  @Input() public channelEmittd: any;
  @ViewChild('UploadFileInput', { static: false }) uploadFileInput: ElementRef | undefined;
  selectedChannel: Channel;
  @Input() courseID?: string;
  @Input() topicID?: string;
  @Input() channelID?: string;
  @Output() onSubmitted: EventEmitter<void> = new EventEmitter();
  materialType: string = ""
  materialId: Material;
  materialComponent = MaterialComponent;
  pdfAddModelDisplay:boolean = false;
  videoAddModelDisplay:boolean = false;
  isFileSelectedInvalid:boolean = true;
  invalidPDFFileMessage:string = "Please choose a PDF file";
  pdfAttachButtonText = "Attach a PDF";
  chosenFile=null;
  urlOrFile = "urlOption";
  videoAttachButtonText = "Attach a video"
  invalidVideoFileMessage:string = "Please choose a video file"
  materialToAdd: CreateMaterial = {
    name: '',
    type: 'pdf',
    courseID: '',
    topicID: '',
    channelID: '',
    url: '',
  
    description: ''
  }


  showPdfAddModel() {
    this.pdfAddModelDisplay = true;
    this.materialType = 'pdf';
    console.log(this.materialType)
}
  showVideoAddModel() {
    this.videoAddModelDisplay = true;
    this.materialType = 'video';
    console.log(this.materialType)
}


  formData: FormData = null;
  validateForm: FormGroup;
  channelName: string = ''
  subs = new Subscription()
  response: any
  fileUploadForm: FormGroup | undefined;
  fileInputLabel: string | undefined;
  radioFormGroup:FormGroup;
  urlFormControl = new FormControl('',[Validators.required]);

  
  constructor(private formBuilder: FormBuilder, 
    private fb: FormBuilder, 
    private materialService: MaterilasService, 
    private topicChannelService: TopicChannelService,
    private router: Router) {
  }

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      materialName: ['', [Validators.required]],
      //REMEMBER THIS WILL CAUSE ERRORS
      description: [''],
    });

    this.fileUploadForm = this.formBuilder.group({
      file: ['', []]
    });
    //customValidator(this.validateForm.get("url").value, this.fileUploadForm.get("file").value);

    this.radioFormGroup = new FormGroup({
      videoRadio: new FormControl('urlOption'),
    });
    this.radioFormGroup.valueChanges.subscribe(val =>{
      this.urlOrFile = val.videoRadio;
      this.resetDialogs();
    })

  }


/*   onFileSelect(event) {

    this.file = <File>event.target.files[0];
    console.log(this.file);
    this.fileInputLabel = this.file["name"];
    const fileChosen = document.getElementById('file-chosen');
    fileChosen!.textContent = this.fileInputLabel
    this.fileUploadForm?.get('file')?.setValue(this.file);
    event.target.value = '';

  }
 */

  //this method basically makes the input boxes red only after the submit button is pressed
  validateFields(){
    if(!this.chosenFile && this.materialType==="pdf"){
      this.invalidPDFFileMessage = "Please choose a PDF file";
    }
    Object.keys(this.validateForm.controls).forEach(field=>{
      const control = this.validateForm.get(field);
      control.markAsTouched({onlySelf:true});
    })
  }

  submitForm(): void {
    console.log("submit form called");
      if(this.materialType ==="pdf"){
      if(this.chosenFile ===null){
        return;
      }
      this.validateFields();
      this.pdfAddModelDisplay = false
    }

    if(this.materialType === "video"){
      this.validateFields();
      this.videoAddModelDisplay = false;
      
    }
    let file = this.chosenFile;
    this.materialToAdd.courseID = this.courseID!;
    this.materialToAdd.topicID = this.topicID!;
    this.materialToAdd.channelID = this.channelID!;
    this.materialToAdd.type = this.materialType as MaterialType;
    this.materialToAdd.name = this.validateForm.controls['materialName'].value
    this.materialToAdd.description = this.validateForm.controls['description'].value
    if (this.materialType == "video") {
      if (this.urlFormControl.value) {
        this.materialToAdd.url = this.urlFormControl.value;
      }
      else {
        this.materialToAdd.url = ""
      }

    }
    else if (this.materialType == "pdf") {
      //this.API_URL + "/public/uploads/pdfs/"+this.materialId+".pdf"
      this.materialToAdd.url = "/public/uploads/pdfs/"
    }

    console.log("this.materialToAdd")
    console.log(this.materialToAdd)
    var result = this.materialService.addMaterial(this.materialToAdd).subscribe({
      next: (data) => {

        this.materialId = data.material._id;
        if (file) {
          if (this.materialType == "video") {

            this.formData = new FormData();
            this.formData.append('file', file, data.material._id + ".mp4");
          }

          if (this.materialType == "pdf") {
            console.log("this is the file: ");
            console.log(file);
            this.formData = new FormData();
            this.formData.append('file', file, data.material._id + ".pdf");
          }


          this.materialService.uploadFile(this.formData, this.materialType).subscribe(res => {
            if (res.message === "File uploaded successfully!") {
              this.response = res
              this.fileUploadForm.reset();


              /* const fileChosen = document.getElementById('file-chosen');
              fileChosen!.textContent = "" */
              /* let file = document.getElementById('file');
              file!.textContent = "" */
              /* this.fileUploadForm?.get('file')?.setValue(null); */
              this.resetDialogs();
                console.log("materialemit")
              // this.materialemit=data.material._id
              //console.log(this.materialemit)
              this.validateForm.reset();

              this.topicChannelService.selectChannel(this.channelEmittd)
              this.router.navigate(['course', data.material.courseId, 'channel', data.material.channelId]);

              //  this.reloadCurrentRoute()
            }
          }, er => {
            console.log(er);
            alert(er.error.error);
          });
        }
        else if (!file) {
          console.log("materialemit without file")
          // this.materialemit=data.material._id
          //console.log(this.materialemit)
          this.validateForm.reset();

          this.topicChannelService.selectChannel(this.channelEmittd)
          this.validateForm['url'].setValue = ""
        }


      }
    })
    if (result != null) {
      this.fileUploadForm.reset();
      //window.location.reload()
      //  "['artist', track.artistId]"
      // this.router.navigate(['course', this.channelID])
      // this.router.navigate(['course', this.courseID,'channel', this.channelID, 'material',this.materialId ])
      // this.router.navigate(['course', this.courseID])
      console.log(result)
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

  myUploader(event){
    console.log(event);
    this.chosenFile = event.currentFiles[0];
    
    if(this.materialType === "pdf"){
      if(this.chosenFile.type!=="application/pdf"){
        this.isFileSelectedInvalid = true;
        this.invalidPDFFileMessage = "* Please upload a PDF File";
      }
      else{
        this.isFileSelectedInvalid= false;
        this.invalidPDFFileMessage = "";
        this.pdfAttachButtonText = this.chosenFile.name;
      }
      return;
    }

    if(this.materialType ==="video"){
      this.isFileSelectedInvalid = false;
      this.invalidVideoFileMessage = "";
      this.videoAttachButtonText = this.chosenFile.name;
    }
  }

  resetDialogs(event?){
    console.log("reset pdf element called!");
    Object.keys(this.validateForm.controls).forEach(field=>{
      const control = this.validateForm.get(field);
      control.markAsUntouched({onlySelf:true});
    });
    this.urlFormControl.reset();
    this.validateForm.reset();
    this.chosenFile = null;
    this.invalidPDFFileMessage = "Please choose a PDF file";
    this.pdfAttachButtonText = "Select a PDF";
    this.invalidVideoFileMessage= "Please choose a video file";
    this.videoAttachButtonText = "Select a video"
    this.isFileSelectedInvalid = true;

    
  }
  
}


