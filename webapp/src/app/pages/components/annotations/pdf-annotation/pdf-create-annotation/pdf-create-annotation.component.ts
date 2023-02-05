import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Annotation, AnnotationType } from 'src/app/models/Annotations';
import {
  getAnnotationProperties,
  getCreateAnnotationFromPanel,
  State,
} from '../state/annotation.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-pdf-create-annotation',
  templateUrl: './pdf-create-annotation.component.html',
  styleUrls: ['./pdf-create-annotation.component.css'],
})
export class PdfCreateAnnotationComponent implements OnInit {
  selectedAnnotationType: AnnotationType;
  annotationTypes: string[];
  createAnnotationFromPanel$: Observable<boolean>;
  showCancelButton: boolean = false;
  disableSlidesDropDown: boolean = false;
  text: string;
  annotation: Annotation;

  constructor(private store: Store<State>) {
    this.annotationTypes = ['note', 'question', 'externalResource'];

    store.select(getCreateAnnotationFromPanel).subscribe((isFromPanel) =>{
      if(isFromPanel){
        this.showCancelButton = false;
        this.disableSlidesDropDown = false;
      }else{
        this.showCancelButton = true;
        this.disableSlidesDropDown = true;
      }
    });
    this.store.select(getAnnotationProperties).subscribe((_annotation) => {
      this.annotation = _annotation;
    });
  }

  ngOnInit(): void {}

  postAnnotation() {
    this.annotation = {
      ...this.annotation,
      type: this.selectedAnnotationType,
      content: this.text,
    };

    this.store.dispatch(
      AnnotationActions.setAnnotationProperties({ annotation: this.annotation })
    );
    this.store.dispatch(
      AnnotationActions.postAnnotation({ annotation: this.annotation })
    );
  }

  cancel(){
    this.store.dispatch(AnnotationActions.setIsAnnotationCanceled({isAnnotationCanceled: true}));
  }
}
