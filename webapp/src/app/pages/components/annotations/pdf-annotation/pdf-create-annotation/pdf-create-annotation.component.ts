import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import {
  Annotation,
  AnnotationType,
  PdfGeneralAnnotationLocation,
  PdfToolType,
} from 'src/app/models/Annotations';
import {
  getAnnotationProperties,
  getCreateAnnotationFromPanel,
  getCurrentPdfPage,
  getPdfTotalNumberOfPages,
  State,
} from '../state/annotation.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import { Observable } from 'rxjs';
import {
  getCurrentCourseId,
  getCurrentMaterialId,
} from '../../../materils/state/materials.reducer';

@Component({
  selector: 'app-pdf-create-annotation',
  templateUrl: './pdf-create-annotation.component.html',
  styleUrls: ['./pdf-create-annotation.component.css'],
})
export class PdfCreateAnnotationComponent implements OnInit {
  selectedAnnotationType: AnnotationType;
  annotationTypesArray: string[];
  annotationLocationsArray: string[];
  selectedAnnotationLocation: string;
  createAnnotationFromPanel: boolean;
  showCancelButton: boolean = false;
  disableSlidesDropDown: boolean = false;
  text: string;
  annotation: Annotation;
  courseId: string;
  materialId: string;
  postAnnotationLocation: PdfGeneralAnnotationLocation;
  currentPage: number;
  totalPages: number;
  isFromSelected: boolean = false;
  fromPageArray: number[];
  toPageArray: number[];
  selectedFromPage: number;
  selectedToPage: number;

  constructor(private store: Store<State>) {
    this.annotationTypesArray = ['Note', 'Question', 'External Resource'];
    this.annotationLocationsArray = ['Current Page', 'All Slides', 'Page Range'];

    store.select(getCreateAnnotationFromPanel).subscribe((isFromPanel) => {
      if (isFromPanel) {
        this.createAnnotationFromPanel = isFromPanel;
        this.showCancelButton = false;
        this.disableSlidesDropDown = false;
      } else {
        this.showCancelButton = true;
        this.disableSlidesDropDown = true;
      }
    });

    this.store.select(getAnnotationProperties).subscribe((_annotation) => {
      this.annotation = _annotation;
    });
    this.store.select(getCurrentCourseId).subscribe((id) => {
      this.courseId = id;
    });

    this.store.select(getCurrentMaterialId).subscribe((id) => {
      this.materialId = id;
    });

    this.store.select(getCurrentPdfPage).subscribe((page) => {
      this.currentPage = page;
    });

    this.store.select(getPdfTotalNumberOfPages).subscribe((total) => {
      this.totalPages = total;
      this.fromPageArray = Array.from({length: this.totalPages}, (_, i) => i + 1);
    });
  }

  ngOnInit(): void {}

  postAnnotation() {
    if (this.createAnnotationFromPanel) {
      this.annotation = null;
      switch (this.selectedAnnotationLocation) {
        case 'Current Page':
          this.annotation = {
            type: this.selectedAnnotationType,
            content: this.text,
            courseId: this.courseId,
            materialID: this.materialId,
            location: {
              type: this.selectedAnnotationLocation,
              startPage: this.currentPage,
              lastPage: this.currentPage
            },
            tool: {
              type: PdfToolType.Annotation,
              _id: ''
            }
          };
          this.store.dispatch(
            AnnotationActions.postAnnotation({ annotation: this.annotation })
          );
          this.selectedAnnotationLocation = null;
          this.selectedAnnotationType = null;
          this.text = null;
          break;

        case 'All Slides':
          this.annotation = {
            type: this.selectedAnnotationType,
            content: this.text,
            courseId: this.courseId,
            materialID: this.materialId,
            location: {
              type: this.selectedAnnotationLocation,
              startPage: 1,
              lastPage: this.totalPages
            },
            tool: {
              type: PdfToolType.Annotation,
              _id: ''
            }
          };
          this.store.dispatch(
            AnnotationActions.postAnnotation({ annotation: this.annotation })
          );
          this.selectedAnnotationLocation = null;
          this.selectedAnnotationType = null;
          this.text = null;
          break;

        case 'Page Range':
          this.annotation = {
            type: this.selectedAnnotationType,
            content: this.text,
            courseId: this.courseId,
            materialID: this.materialId,
            location: {
              type: this.selectedAnnotationLocation,
              startPage: this.selectedFromPage,
              lastPage: this.selectedToPage
            },
            tool: {
              type: PdfToolType.Annotation,
              _id: ''
            }
          };
          this.store.dispatch(
            AnnotationActions.postAnnotation({ annotation: this.annotation })
          );
          this.selectedAnnotationLocation = null;
          this.selectedAnnotationType = null;
          this.text = null;
          break;
      }
    } else {
      this.annotation = {
        ...this.annotation,
        type: this.selectedAnnotationType,
        content: this.text
      };

      this.store.dispatch(
        AnnotationActions.setAnnotationProperties({
          annotation: this.annotation,
        })
      );
      this.store.dispatch(
        AnnotationActions.postAnnotation({ annotation: this.annotation })
      );
    }
  }

  onSelectedFromPage(){
    if(this.selectedFromPage === null){
      this.isFromSelected = false
    }else{
      this.toPageArray = Array.from({length: this.totalPages - this.selectedFromPage + 1}, (_, i) => i + this.selectedFromPage);
      this.isFromSelected = true;
    }
  }

  onShowOfSelectedFromPageDropDpown(){
    this.isFromSelected = false;
  }
  cancel() {
    this.store.dispatch(
      AnnotationActions.setIsAnnotationCanceled({ isAnnotationCanceled: true })
    );
  }
}
