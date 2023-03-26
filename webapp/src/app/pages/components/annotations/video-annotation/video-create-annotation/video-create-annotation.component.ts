import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Annotation, AnnotationType, VideoAnnotationTool } from 'src/app/models/Annotations';
import { printTime } from 'src/app/_helpers/format';
import { getCurrentCourseId, getCurrentMaterialId } from '../../../materils/state/materials.reducer';
import { getCurrentTime, getDrawingData, getIsAnnotationDialogVisible, getIsBrushSelectionActive, getIsPinpointSelectionActive, getPinPointPosition, getVideoDuration, State } from '../state/video.reducer';
import * as AnnotationActions from '../../pdf-annotation/state/annotation.actions'
import * as VideoActions from 'src/app/pages/components/annotations/video-annotation/state/video.action'
import { Observable } from 'rxjs';
import { DrawingData } from 'src/app/models/Drawing';

@Component({
  selector: 'app-video-create-annotation',
  templateUrl: './video-create-annotation.component.html',
  styleUrls: ['./video-create-annotation.component.css']
})
export class VideoCreateAnnotationComponent implements OnInit {
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
  showAnnotationDialog: boolean;
  courseId: string;
  materialId: string;
  isAnnotationDialogVisible: boolean;
  drawingData: DrawingData;
  pinpointPosition: [number, number];
  isBrushSelectionActive: boolean;
  isPinpointSelectionActive: boolean;
  sendButtonColor: string = 'text-green-600';
  
  constructor(private store: Store<State>){
    this.annotationTypesArray = ['Note', 'Question', 'External Resource'];
    this.annotationLocationsArray = ['Current Timeline', 'Whole Video', 'Timeline Selection'];

    this.store.select(getVideoDuration).subscribe((duration) => this.maxTime = duration);
    this.store.select(getCurrentTime).subscribe((currentTime) => this.currentTime = currentTime);
    this.store.select(getCurrentCourseId).subscribe((id) => this.courseId = id);
    this.store.select(getCurrentMaterialId).subscribe((id) => this.materialId = id);
    this.store.select(getIsAnnotationDialogVisible).subscribe((isVisible) => {
      this.isAnnotationDialogVisible = isVisible;
    })
    this.store.select(getDrawingData).subscribe((drawings) => this.drawingData = drawings);
    this.store.select(getIsBrushSelectionActive).subscribe((isBrush) => this.isBrushSelectionActive = isBrush);
    this.store.select(getIsPinpointSelectionActive).subscribe((isPin) => this.isPinpointSelectionActive = isPin);
    this.store.select(getIsAnnotationDialogVisible).subscribe((isVisible) => this.showAnnotationDialog == isVisible);
    this.store.select(getPinPointPosition).subscribe((position) => this.pinpointPosition = position);
  }
  ngOnInit(): void {
    this.selectedAnnotationType = 'Note';
    this.selectedAnnotationLocation = 'Current Timeline';
    this.annotationColor = '#70b85e';
  }
  printTime = printTime

  onAnnotationTypeChange(){
    switch (this.selectedAnnotationType) {
      case 'Note':
        this.annotationColor = '#70b85e';
        this.sendButtonColor ='text-green-600';
        break;
      case 'Question':
        this.annotationColor = '#FFAB5E';
        this.sendButtonColor ='text-amber-500';
        break;
      case 'External Resource':
        this.annotationColor = '#B85E94';
        this.sendButtonColor ='text-pink-700';
        break;
      case null:
        this.annotationColor = '#0000004D';
        this.sendButtonColor ='text-green-600';
        break;
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

    if(!this.isAnnotationDialogVisible){

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
    }else{
      if(this.isBrushSelectionActive){
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
            type: "brush",
            data: this.drawingData
          }
        }
        this.dispatchAnnotation();
      }else if(this.isPinpointSelectionActive){
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
            type: "pin",
            x: this.pinpointPosition[0],
            y: this.pinpointPosition[1]
            
          }
        }
        this.dispatchAnnotation();
      }
    }
  }

  dispatchAnnotation(){
    this.store.dispatch(AnnotationActions.postAnnotation({ annotation: this.createdAnnotation }));
    this.store.dispatch(VideoActions.SetIsAnnotationDialogVisible({isAnnotationDialogVisible: false}));
    this.store.dispatch(VideoActions.setIsBrushSelectionActive({isBrushSelectionActive: false}));
    this.store.dispatch(VideoActions.setIsPinpointSelectionActive({isPinpointSelectionActive: false}));
    this.store.dispatch(VideoActions.SetDrawingData({drawingData: null}));
    this.store.dispatch(VideoActions.SetPinPointPosition({pinpointPosition: [null, null]}));
    this.annotationColor = '#0000004D';
    this.selectedAnnotationLocation = null;
    this.selectedAnnotationType = null;
    this.content = null;
  }

  cancelCreateAnnotation(){
    this.store.dispatch(VideoActions.SetIsAnnotationCreationCanceled({isAnnotationCreationCanceled: true}));
  }

}
