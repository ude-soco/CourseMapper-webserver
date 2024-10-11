import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Annotation,
  AnnotationType,
  VideoAnnotationTool,
} from 'src/app/models/Annotations';
import { printTime } from 'src/app/_helpers/format';
import { getCurrentMaterialId } from '../../../materials/state/materials.reducer';
import {
  getCurrentTime,
  getDrawingData,
  getIsAnnotationDialogVisible,
  getIsBrushSelectionActive,
  getIsPinpointSelectionActive,
  getPinPointPosition,
  getVideoDuration,
  State,
} from '../state/video.reducer';
import { State as AnnotationState } from '../../pdf-annotation/state/annotation.reducer';

import * as AnnotationActions from '../../pdf-annotation/state/annotation.actions';
import * as VideoActions from 'src/app/pages/components/annotations/video-annotation/state/video.action';
import { Observable } from 'rxjs';
import { DrawingData } from 'src/app/models/Drawing';
import { getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';
import { MentionsComponent } from '../../../../../components/mentions/mentions.component';
import { NotificationsService } from 'src/app/services/notifications.service';

@Component({
  selector: 'app-video-create-annotation',
  templateUrl: './video-create-annotation.component.html',
  styleUrls: ['./video-create-annotation.component.css'],
})
export class VideoCreateAnnotationComponent
  extends MentionsComponent
  implements OnInit, OnDestroy
{
  annotationColor: string = '#70b85e';
  rangeValues: number[];
  selectedAnnotationType: AnnotationType;
  selectedAnnotationLocation: string;
  annotationTypesArray: string[];
  annotationLocationsArray: string[];
  isTimeLineSelection: boolean;
  minTime: number = 0;
  maxTime: number;
  currentTime: number;
  createdAnnotation: Annotation;
  showAnnotationDialog: boolean;
  materialId: string;
  isAnnotationDialogVisible: boolean;
  drawingData: DrawingData;
  pinpointPosition: [number, number];
  isBrushSelectionActive: boolean;
  isPinpointSelectionActive: boolean;
  sendButtonColor: string = 'text-green-600';
  sendButtonDisabled: boolean = true;
  currentTimeSubscription: any;

  constructor(
    private videoStore: Store<State>,
    annotationStore: Store<AnnotationState>,
    override notificationService: NotificationsService
  ) {
    super(annotationStore, notificationService);
  }
  ngOnDestroy(): void {
    this.currentTimeSubscription?.unsubscribe();
  }

  override ngOnInit(): void {
    super.ngOnInit();
    this.selectedAnnotationType = 'Note';
    this.selectedAnnotationLocation = 'Current Timeline';
    this.annotationColor = '#70b85e';

    this.annotationTypesArray = ['Note', 'Question', 'External Resource'];
    this.annotationLocationsArray = [
      'Current Timeline',
      'Whole Video',
      'Timeline Selection',
    ];

    this.videoStore
      .select(getVideoDuration)
      .subscribe((duration) => (this.maxTime = duration));
    this.currentTimeSubscription = this.videoStore
      .select(getCurrentTime)
      .subscribe((currentTime) => (this.currentTime = currentTime));
    this.videoStore
      .select(getCurrentCourseId)
      .subscribe((id) => (this.courseId = id));
    this.videoStore
      .select(getCurrentMaterialId)
      .subscribe((id) => (this.materialId = id));
    this.videoStore
      .select(getIsAnnotationDialogVisible)
      .subscribe((isVisible) => {
        this.isAnnotationDialogVisible = isVisible;
      });
    this.videoStore
      .select(getDrawingData)
      .subscribe((drawings) => (this.drawingData = drawings));
    this.videoStore
      .select(getIsBrushSelectionActive)
      .subscribe((isBrush) => (this.isBrushSelectionActive = isBrush));
    this.videoStore
      .select(getIsPinpointSelectionActive)
      .subscribe((isPin) => (this.isPinpointSelectionActive = isPin));
    this.videoStore
      .select(getIsAnnotationDialogVisible)
      .subscribe((isVisible) => this.showAnnotationDialog == isVisible);
    this.videoStore
      .select(getPinPointPosition)
      .subscribe((position) => (this.pinpointPosition = position));
  }
  printTime = printTime;

  onAnnotationTypeChange() {
    switch (this.selectedAnnotationType) {
      case 'Note':
        this.annotationColor = '#70b85e';
        this.sendButtonColor = 'text-green-600';
        break;
      case 'Question':
        this.annotationColor = '#FFAB5E';
        this.sendButtonColor = 'text-amber-500';
        break;
      case 'External Resource':
        this.annotationColor = '#B85E94';
        this.sendButtonColor = 'text-pink-700';
        break;
      case null:
        this.annotationColor = '#70b85e';
        this.sendButtonColor = 'text-green-600';
        break;
    }
  }

  onAnnotationLocationChange() {
    if (this.selectedAnnotationLocation == 'Timeline Selection') {
      this.rangeValues = [this.currentTime, this.maxTime];
      this.isTimeLineSelection = true;
    } else {
      this.isTimeLineSelection = false;
    }
  }

  onSliderChange(ranges: number[]) {}

  onTextChange() {
    if (this.content.replace(/<\/?[^>]+(>|$)/g, '') == '') {
      this.sendButtonDisabled = true;
    } else {
      this.sendButtonDisabled = false;
    }
  }

  postAnnotation() {
    this.createdAnnotation = null;
    if (!this.selectedAnnotationType) {
      alert('Please Choose Annotation Type');
      return;
    }

    if (this.content.replace(/<\/?[^>]+(>|$)/g, '') == '') {
      alert('Cannot Post an Empty Annotation');
      return;
    }

    if (!this.isBrushSelectionActive && !this.isPinpointSelectionActive) {
      if (!this.selectedAnnotationLocation) {
        alert('Please Choose Annotation Time Location');
        return;
      }

      switch (this.selectedAnnotationLocation) {
        case 'Current Timeline': {
          this.createdAnnotation = {
            type: this.selectedAnnotationType,
            content: this.content,
            courseId: this.courseId,
            materialId: this.materialId,
            location: {
              type: 'time',
              from: this.currentTime,
              to: this.currentTime + 5,
            },
            tool: {
              type: 'annotation',
            },
          };
          this.dispatchAnnotation();
          break;
        }
        case 'Whole Video': {
          this.createdAnnotation = {
            type: this.selectedAnnotationType,
            content: this.content,
            courseId: this.courseId,
            materialId: this.materialId,
            location: {
              type: 'time',
              from: 0,
              to: this.maxTime,
            },
            tool: {
              type: 'annotation',
            },
          };
          this.dispatchAnnotation();
          break;
        }
        case 'Timeline Selection': {
          this.createdAnnotation = {
            type: this.selectedAnnotationType,
            content: this.content,
            courseId: this.courseId,
            materialId: this.materialId,
            location: {
              type: 'time',
              from: this.rangeValues[0],
              to: this.rangeValues[1],
            },
            tool: {
              type: 'annotation',
            },
          };
          this.dispatchAnnotation();
          break;
        }
        default:
          break;
      }
    } else {
      if (this.isBrushSelectionActive) {
        switch (this.selectedAnnotationLocation) {
          case 'Current Timeline': {
            this.createdAnnotation = {
              type: this.selectedAnnotationType,
              content: this.content,
              courseId: this.courseId,
              materialId: this.materialId,
              location: {
                type: 'time',
                from: this.currentTime,
                to: this.currentTime + 5,
              },
              tool: {
                type: 'brush',
                data: this.drawingData,
              },
            };
            this.dispatchAnnotation();
            break;
          }
          case 'Whole Video': {
            this.createdAnnotation = {
              type: this.selectedAnnotationType,
              content: this.content,
              courseId: this.courseId,
              materialId: this.materialId,
              location: {
                type: 'time',
                from: 0,
                to: this.maxTime,
              },
              tool: {
                type: 'brush',
                data: this.drawingData,
              },
            };
            this.dispatchAnnotation();
            break;
          }
          case 'Timeline Selection': {
            this.createdAnnotation = {
              type: this.selectedAnnotationType,
              content: this.content,
              courseId: this.courseId,
              materialId: this.materialId,
              location: {
                type: 'time',
                from: this.rangeValues[0],
                to: this.rangeValues[1],
              },
              tool: {
                type: 'brush',
                data: this.drawingData,
              },
            };
            this.dispatchAnnotation();
            break;
          }
          default:
            break;
        }
      } else if (this.isPinpointSelectionActive) {
        switch (this.selectedAnnotationLocation) {
          case 'Current Timeline': {
            this.createdAnnotation = {
              type: this.selectedAnnotationType,
              content: this.content,
              courseId: this.courseId,
              materialId: this.materialId,
              location: {
                type: 'time',
                from: this.currentTime,
                to: this.currentTime + 5,
              },
              tool: {
                type: 'pin',
                x: this.pinpointPosition[0],
                y: this.pinpointPosition[1],
              },
            };
            this.dispatchAnnotation();
            break;
          }
          case 'Whole Video': {
            this.createdAnnotation = {
              type: this.selectedAnnotationType,
              content: this.content,
              courseId: this.courseId,
              materialId: this.materialId,
              location: {
                type: 'time',
                from: 0,
                to: this.maxTime,
              },
              tool: {
                type: 'pin',
                x: this.pinpointPosition[0],
                y: this.pinpointPosition[1],
              },
            };
            this.dispatchAnnotation();
            break;
          }
          case 'Timeline Selection': {
            this.createdAnnotation = {
              type: this.selectedAnnotationType,
              content: this.content,
              courseId: this.courseId,
              materialId: this.materialId,
              location: {
                type: 'time',
                from: this.rangeValues[0],
                to: this.rangeValues[1],
              },
              tool: {
                type: 'pin',
                x: this.pinpointPosition[0],
                y: this.pinpointPosition[1],
              },
            };
            this.dispatchAnnotation();
            break;
          }
          default:
            break;
        }
      }
    }
  }

  dispatchAnnotation() {
    this.removeRepeatedUsersFromMentionsArray();
    this.videoStore.dispatch(
      AnnotationActions.postAnnotation({
        annotation: this.createdAnnotation,
        mentionedUsers: this.mentionedUsers,
      })
    );
    this.videoStore.dispatch(
      VideoActions.SetIsAnnotationDialogVisible({
        isAnnotationDialogVisible: false,
      })
    );
    this.videoStore.dispatch(
      VideoActions.setIsBrushSelectionActive({ isBrushSelectionActive: false })
    );
    this.videoStore.dispatch(
      VideoActions.setIsPinpointSelectionActive({
        isPinpointSelectionActive: false,
      })
    );
    this.videoStore.dispatch(
      VideoActions.SetDrawingData({ drawingData: null })
    );
    this.videoStore.dispatch(
      VideoActions.SetPinPointPosition({ pinpointPosition: [null, null] })
    );
    this.content = null;
    this.sendButtonDisabled = true;
    this.mentionedUsers = [];
  }

  cancelCreateAnnotation() {
    this.videoStore.dispatch(
      VideoActions.SetIsAnnotationCreationCanceled({
        isAnnotationCreationCanceled: true,
      })
    );
  }
}
