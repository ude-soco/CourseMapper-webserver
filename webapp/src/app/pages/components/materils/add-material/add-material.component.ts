import { Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription } from 'rxjs';
import { Material , CreateMaterial, MaterialType} from 'src/app/models/Material';
import { MaterilasService } from 'src/app/services/materials.service';
import { Channel } from 'src/app/models/Channel';
import { TopicChannelService } from 'src/app/services/topic-channel.service';
import { Router } from '@angular/router';
import { MaterialComponent } from '../material/material.component';


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
  materialId:Material;

  materialToAdd:CreateMaterial={
    name: '',
    type: 'pdf',
    courseID: '',
    topicID: '',
    channelID: '',
    url: '',
  
    description:''
  }
  formData:FormData=null;
  validateForm: FormGroup;
  channelName:string=''
  subs=new Subscription()
  response:any
  fileUploadForm: FormGroup | undefined;
  fileInputLabel: string | undefined;
  
  file:File =null;
  constructor(private formBuilder: FormBuilder,private fb: FormBuilder, private materialService: MaterilasService, private topicChannelService: TopicChannelService
    ,  private router: Router) {    
   
  }

  ngOnInit(): void {

    this.validateForm = this.fb.group({
      materialName: ['', [Validators.required]],
      url: [''],
      description: [''],
    
    });
    this.fileUploadForm = this.formBuilder.group({
      file: ['']
    });
    //customValidator(this.validateForm.get("url").value, this.fileUploadForm.get("file").value);
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

    this.file=<File>event.target.files[0]
    this.fileInputLabel = this.file.name;
    const fileChosen = document.getElementById('file-chosen');
    fileChosen!.textContent = this.file.name

    this.fileUploadForm?.get('file')?.setValue(this.file);
  }
 submitForm(): void {
  var file=this.fileUploadForm?.get('file')?.value
 // var filename=file.name;
 console.log(file)
  //console.log(filename)
  this.materialToAdd.courseID=this.courseID!;
  console.log(this.courseID)
  this.materialToAdd.topicID=this.topicID!;
  console.log(this.topicID)
  this.materialToAdd.channelID=this.channelID!;

  this.materialToAdd.type = this.materialType as MaterialType;
  this.materialToAdd.name=this.validateForm.controls['materialName'].value
  this.materialToAdd.description=this.validateForm.controls['description'].value
  if(this.materialType=="video" ){
    if(this.validateForm.controls['url'].value  ){
      this.materialToAdd.url=this.validateForm.controls['url'].value
    }

  }
  else{
    //this.API_URL + "/public/uploads/pdfs/"+this.materialId+".pdf"
  this.materialToAdd.url="/public/uploads/pdfs/" 
}
  var result=  this.materialService.addMaterial(this.materialToAdd).subscribe({
    next: (data) => {
      this.materialId=data.material._id;
      console.log("material roro")
      console.log(data.material._id)
      if (file) {
   if(this.materialType=="video")
   {
    console.log(file)
    this.formData = new FormData();
        this.formData.append('file', this.file, data.material._id+".mp4");
      }
        
      if(this.materialType=="pdf")
      {
       console.log(file)
       this.formData = new FormData();
           this.formData.append('file', this.file, data.material._id+".pdf");
         }  
    
    
        this.materialService.uploadFile(this.formData, this.materialType).subscribe(res=>{
          if (res.message ==="File uploaded successfully!" ) {
            this.response=res
            window.location.reload()
            this.router.navigate(['course', this.courseID,'channel', this.channelID, 'material',data.material._id ])
          /*  this.router.navigateByUrl('/', {skipLocationChange: true}).then(() => {
              this.router.navigate([MaterialComponent]);
          });*/
          
          
          } 
        }, er => {
          console.log(er);
          alert(er.error.error);
        });
      }
    }
  })
  if(result!=null){
    this.fileUploadForm.reset();
    this.validateForm.reset();
    //window.location.reload()
  //  "['artist', track.artistId]"
   // this.router.navigate(['course', this.channelID])
   this.router.navigate(['course', this.courseID,'channel', this.channelID, 'material',this.materialId ])
  // this.router.navigate(['course', this.courseID])
console.log(result)
   // this.onSubmitted.emit();

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
/*function customValidator(control?: FormControl, control2?: FormControl) { 

  if (control.value && control2.value == "") {
    
      return "Insert on of them"
    
  }
  return control.value || control2.value; 
}*/

