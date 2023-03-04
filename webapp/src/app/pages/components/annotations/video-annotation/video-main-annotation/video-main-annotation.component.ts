import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { Material } from 'src/app/models/Material';
import { PdfviewService } from 'src/app/services/pdfview.service';
import { environment } from 'src/environments/environment';
import { getCurrentMaterial, getCurrentMaterialId } from '../../../materils/state/materials.reducer';
import { State } from '../state/video.reducer';



@Component({
  selector: 'app-video-main-annotation',
  templateUrl: './video-main-annotation.component.html',
  styleUrls: ['./video-main-annotation.component.css']
})
export class VideoMainAnnotationComponent implements OnInit {
  //@ViewChild('videoPlayer') videoplayer: ElementRef;

  @ViewChild('videoPlayer', { static: false }) videoPlayer: ElementRef;
  apiLoaded = false;
materilaId:string;
material:Material;
videoURL=null;

youtubeactivated:boolean;
 

private API_URL = environment.API_URL;

  constructor(private store:Store<State>, private pdfViewService: PdfviewService) { this.getVideoUrl() }

  ngOnInit(): void {
    this.store.select(getCurrentMaterialId).subscribe((id)=> {
      this.materilaId=id
      console.log(this.materilaId)


    })
    if (!this.apiLoaded) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(tag);
      this.apiLoaded = true;
    }

    // this.config = {
    //    sources: [
    //    {
    //        src: this.videoURL,
         
    //    },
    //   ]          
    // };
    
  }

  getVideoUrl() {
    // if(this.material.type=="pdf")
    // { 
    //   this.pdfViewService.currentDocURL.subscribe((url) => {
    //   this.videoURL = this.API_URL + url.replace(/\\/g, '/');
    //   console.log("url")
    //   console.log(url)
    //   console.log(this.videoURL)

    // });}
    // else if(this.material.type=="video"){
    //   this.pdfViewService.currentDocURL.subscribe((url) => {
    //     this.videoURL = url;
    //     console.log("url")
    //     console.log(url)
    //     console.log(this.videoURL)
  
    //   })
    // }
    console.log("this.videoURL of getCurrentMaterial ")
    this.videoURL=null
    console.log(this.videoURL)
    this.store.select(getCurrentMaterial).subscribe((material)=> {
      this.material=material
      console.log(this.material)
       console.log("this.material.url video component")
this.pdfViewService.currentDocURL.subscribe((url) => {
  if(this.material.url)
  { 
    this.youtubeactivated=true;
   console.log("url for youtube")
   var video_id = url.split('v=')[1].split('&')[0];
   this.videoURL =video_id;
console.log(this.videoURL)
   console.log(this.material.url)
   console.log(url)
   
  
  }
  
   else {
    this.youtubeactivated=false;
      this.videoURL = this.API_URL + url.replace(/\\/g, '/');
      this.videoPlayer.nativeElement.load();
      
      this.videoPlayer.nativeElement.play();
      console.log("url for backend")
      console.log(url)
  
      console.log(this.videoURL)
     
    
   }
})
  


    })
   
}
video() {
  console.log('im Play!');
  this.videoPlayer.nativeElement.play();
}
PauseVideo()
{
  console.log('im pause!');
  this.videoPlayer.nativeElement.pause();
}
}
