import { Component } from '@angular/core';
import { Store } from '@ngrx/store';
import { Annotation, AnnotationType, VideoAnnotationTool } from 'src/app/models/Annotations';
import { printTime } from 'src/app/_helpers/format';
import { getCurrentCourseId, getCurrentMaterialId } from '../../../materils/state/materials.reducer';
import { getCurrentTime, getVideoDuration, State } from '../state/video.reducer';
import * as AnnotationActions from '../../pdf-annotation/state/annotation.actions'

@Component({
  selector: 'app-video-create-annotation',
  templateUrl: './video-create-annotation.component.html',
  styleUrls: ['./video-create-annotation.component.css']
})
export class VideoCreateAnnotationComponent {
  annotationColor: string = '#0000004D';
  rangeValues: number[];
  selectedAnnotationType: AnnotationType;
  selectedAnnotationLocation: string;
  annotationTypesArray: string[];
  annotationLocationsArray: string[];
  isTimeLineSelection: boolean;
  minTime: number = 0;
  maxTime: number;
  currentTime: number;
  content: string = "";
  createdAnnotation: Annotation;
  showAnnotationDialog: boolean = false;
  courseId: string;
  materialId: string;
  
  constructor(private store: Store<State>){
    this.annotationTypesArray = ['Note', 'Question', 'External Resource'];
    this.annotationLocationsArray = ['Current Timeline', 'Whole Video', 'Timeline Selection'];

    this.store.select(getVideoDuration).subscribe((duration) => this.maxTime = duration);
    this.store.select(getCurrentTime).subscribe((currentTime) => this.currentTime = currentTime);
    this.store.select(getCurrentCourseId).subscribe((id) => this.courseId = id);
    this.store.select(getCurrentMaterialId).subscribe((id) => this.materialId = id);
  }
  printTime = printTime

  onAnnotationTypeChange(){
    switch (this.selectedAnnotationType) {
      case 'Note':
        this.annotationColor = '#70b85e';
        break;
      case 'Question':
        this.annotationColor = '#FFAB5E';
        break;
      case 'External Resource':
        this.annotationColor = '#B85E94';
        break;
      case null:
        this.annotationColor = '#0000004D';
    }
  }

  onAnnotationLocationChange(){
    if(this.selectedAnnotationLocation == "Timeline Selection"){
      this.rangeValues = [this.currentTime, this.maxTime];
      this.isTimeLineSelection = true;
    }
    else{
      this.isTimeLineSelection = false;
    }
  }

  onSliderChange(ranges: number[]){

  }

  postAnnotation(){
    this.createdAnnotation = null;
    if(!this.selectedAnnotationType){
      alert("Please Choose Annotation Type");
      return;
    }

    if(this.content.replace(/<\/?[^>]+(>|$)/g, "") == ""){
      alert("Cannot Post an Empty Annotation");
      return;
    }

    if(!this.showAnnotationDialog){

      if(!this.selectedAnnotationLocation){
        alert("Please Choose Annotation Time Location");
        return;
      }

      let createdTool: VideoAnnotationTool
      switch(this.selectedAnnotationLocation){
        case "Current Timeline":{
          this.createdAnnotation = {
            type: this.selectedAnnotationType,
            content: this.content,
            courseId: this.courseId,
            materialID: this.materialId,
            location: {
              type: "time",
              from: this.currentTime,
              to: this.currentTime + 5
            },
            tool: {
              type: "annotation"
            }
          }
          this.dispatchAnnotation();
          break;
        }
        case "Whole Video":{
          this.createdAnnotation = {
            type: this.selectedAnnotationType,
            content: this.content,
            courseId: this.courseId,
            materialID: this.materialId,
            location: {
              type: "time",
              from: 0,
              to: this.maxTime
            },
            tool: {
              type: "annotation"
            }
          }
          this.dispatchAnnotation();
          break;
        }
        case "Timeline Selection":{
          this.createdAnnotation = {
            type: this.selectedAnnotationType,
            content: this.content,
            courseId: this.courseId,
            materialID: this.materialId,
            location: {
              type: "time",
              from: this.rangeValues[0],
              to: this.rangeValues[1]
            },
            tool: {
              type: "annotation"
            }
          }
          this.dispatchAnnotation();
          break;
        }
        default:
          break;
      }
    }
  }

  dispatchAnnotation(){
    this.store.dispatch(AnnotationActions.postAnnotation({ annotation: this.createdAnnotation }));
    this.annotationColor = '#0000004D';
    this.selectedAnnotationLocation = null;
    this.selectedAnnotationType = null;
    this.content = null;
  }

}
