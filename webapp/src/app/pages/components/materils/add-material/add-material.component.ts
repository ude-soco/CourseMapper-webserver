import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Material , CreateMaterial, MaterialType} from 'src/app/models/Material';
import { MaterilasService } from 'src/app/services/materials.service';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';


@Component({
  selector: 'app-add-material',
  templateUrl: './add-material.component.html',
  styleUrls: ['./add-material.component.css']
})
export class AddMaterialComponent implements OnInit {
  @ViewChild('UploadFileInput', { static: false }) uploadFileInput: ElementRef | undefined;
  selectedChannel: Channel;
  @Input() courseID?: string;
  @Input() topicID?: string;
  @Input() channelID?: string;
  @Output() onSubmitted: EventEmitter<void> = new EventEmitter();
  materialType:string=""

  materialToAdd:CreateMaterial={
    name: '',
    type: 'pdf',
    courseID: '',
    topicID: '',
    channelID: '',
    url: '',
    userID: '',
    description:''
  }
  validateForm: FormGroup;
  channelName:string=''
  subs=new Subscription()
  response:any
  fileUploadForm: FormGroup | undefined;
  fileInputLabel: string | undefined;
  
  constructor(private formBuilder: FormBuilder,private fb: FormBuilder, private materialService: MaterilasService, private topicChannelService: TopicChannelService) {    
    this.validateForm = this.fb.group({
    materialName: ['', [Validators.required]],
    url: [''],
    description: ['']
  }); }

  ngOnInit(): void {
   this.fileUploadForm = this.formBuilder.group({
      uploadedFile: ['']
    });


  }
  videoTab()
{
  this.materialType='video';
  console.log(this.materialType)
}
  pdfTab()
{
 
  this.materialType='pdf';
  console.log(this.materialType)
}

  onFileSelect(event) {
    const target = event.target as HTMLInputElement;
    const file: File = (target.files as FileList)[0];
    this.fileInputLabel = file.name;
    const fileChosen = document.getElementById('file-chosen');
    fileChosen!.textContent = file.name

    this.fileUploadForm?.get('uploadedFile')?.setValue(file);
  }
 submitForm(): void {
  if (!this.fileUploadForm?.get('uploadedFile')?.value) {
    if(this.materialType == "pdf"){
      alert('Please fill valid details!');
      return;
    } else {
      if (!this.validateForm.controls['url'].value) {
        alert('Please select a file or enter a YouTube or Vimeo URL!');
        return;
      } else {
        const videoURL = this.validateForm.controls['url'].value;
        const vimeoMatches = videoURL?.match(/^https?:\/\/vimeo.com\/(\d+)/);
        const youtubeMatches = videoURL?.match(/^(https?\:\/\/)?(youtube\.com|www\.youtube\.com|youtu\.be)\/.+$/);
        
        if ((!vimeoMatches || vimeoMatches.length < 2) && (!youtubeMatches || youtubeMatches.length < 2)) {
          alert('Please select a file or enter a YouTube or Vimeo URL!');
          return;
        }
      }
    }
  }

  if (this.fileUploadForm?.get('uploadedFile')?.value) {
   
    console.log(this.fileUploadForm?.get('uploadedFile')?.value)
    const formData = new FormData();
    formData.append('uploadedFile', this.fileUploadForm?.get('uploadedFile')?.value);
    formData.append('agentId', '007');
console.log(formData)
    this.materialService.uploadFile(formData, this.materialType).subscribe(res=>{
      if (res.message ==="File uploaded successfully!" ) {
        console.log("Uploading done")
        this.response=res
        this.uploadMaterial()
        console.log("Uploading material done")
        // Reset the file input
        this.uploadFileInput!.nativeElement.value = "";
        this.fileInputLabel = undefined;
        
      } 
    }, er => {
      console.log(er);
      alert(er.error.error);
    });
  } else {
    this.uploadMaterial();
  }


   
  } 

    uploadMaterial(){
      var file=this.fileUploadForm?.get('uploadedFile')?.value
      var filename=file.name;
      console.log("filename")
      console.log(filename)
      this.materialToAdd.courseID=this.courseID!;
      console.log(this.courseID)
      this.materialToAdd.topicID=this.topicID!;
      console.log(this.topicID)
      this.materialToAdd.channelID=this.channelID!;
  
      this.materialToAdd.type = this.materialType as MaterialType;
      this.materialToAdd.name=this.validateForm.controls['materialName'].value
      this.materialToAdd.description=this.validateForm.controls['description'].value
      if(this.materialType=="video" && !this.response){
        this.materialToAdd.url=this.validateForm.controls['url'].value
      }else{
        this.materialToAdd.url=this.channelID!+"_"+this.validateForm.controls['materialName'].value+"_"+filename
      }
      var result=  this.materialService.addMaterial(this.materialToAdd).subscribe({
        next: (data) => {
          console.log("material")
          console.log(data)
        }
      })
      if(result!=null){
console.log(result)
       // this.onSubmitted.emit();
  
      }
    }
}

