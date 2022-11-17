import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Material , CreateMaterial, MaterialType} from 'src/app/models/Material';
import { MaterilasService } from 'src/app/services/materials.service';

@Component({
  selector: 'app-add-material',
  templateUrl: './add-material.component.html',
  styleUrls: ['./add-material.component.css']
})
export class AddMaterialComponent implements OnInit {
  @ViewChild('UploadFileInput', { static: false }) uploadFileInput: ElementRef | undefined;
  @Input() courseID?: string;
  @Input() topicID?: string;
  @Input() channelID?: string;
  @Output() onSubmitted: EventEmitter<void> = new EventEmitter();
  materialType:string='lecture'
   formData = new FormData();
  materialToAdd:CreateMaterial={
    name: '',
    type: 'lecture',
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
  
  constructor(private formBuilder: FormBuilder,private fb: FormBuilder, private materialService: MaterilasService) {    
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

  onFileSelect(event) {
    const target = event.target as HTMLInputElement;
    const file: File = (target.files as FileList)[0];
    this.fileInputLabel = file.name;
    const fileChosen = document.getElementById('file-chosen');
    fileChosen!.textContent = file.name

    this.fileUploadForm?.get('uploadedFile')?.setValue(file);
  }
 submitForm(): void {
  this.uploadMaterial()
/*
    if (!this.fileUploadForm?.get('uploadedFile')?.value) {
      if(this.materialType == "lecture"){
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
      
 this.uploadMaterial();
 this.mapForm();
    } */
   
  } 
  private mapForm()
    {
      
      //this.formData.set(this.materialToAdd)
      this.formData.append('uploadedFile', this.fileUploadForm?.get('uploadedFile')?.value);
     this. formData.append('agentId', '007');
     
    }
    uploadMaterial(){
      this.materialToAdd.courseID=this.courseID!;
      console.log(this.courseID)
      this.materialToAdd.topicID=this.topicID!;
      console.log(this.topicID)
      this.materialToAdd.channelID=this.channelID!;
  
      this.materialToAdd.type = this.materialType as MaterialType;
      this.materialToAdd.name=this.validateForm.controls['materialName'].value
      this.materialToAdd.description=this.validateForm.controls['description'].value
     // if(this.materialType=="video" && !this.response){
        this.materialToAdd.url=this.validateForm.controls['url'].value
     /* }else{
        this.materialToAdd.url=this.response.uploadedFile.path
      }*/
      var result=  this.materialService.addMaterial(this.formData,this.materialToAdd).subscribe({
        next: (data) => {
          console.log("material")
          console.log(data)
        }
      })
      if(result!=null){
console.log(result)
        this.onSubmitted.emit();
  
      }
    }
}

