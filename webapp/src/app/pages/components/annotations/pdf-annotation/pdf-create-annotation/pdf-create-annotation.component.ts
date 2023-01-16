import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AnnotationType } from 'src/app/models/Annotations';
import { getCreateAnnotationFromPanel, State } from '../state/annotation.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'
import { Observable } from 'rxjs';

@Component({
  selector: 'app-pdf-create-annotation',
  templateUrl: './pdf-create-annotation.component.html',
  styleUrls: ['./pdf-create-annotation.component.css']
})
export class PdfCreateAnnotationComponent implements OnInit {

  selectedAnnotationType: AnnotationType;
  annotationTypes: string[];
  createAnnotationFromPanel$: Observable<boolean>;
  text: string;
  
  constructor(private store: Store<State>) { 
    this.annotationTypes = [
      "note",
      "question",
      "externalResource"
    ];

    this.createAnnotationFromPanel$ = store.select(getCreateAnnotationFromPanel);
  }

  ngOnInit(): void {
  }

  postAnnotation(){
    this.store.dispatch(AnnotationActions.setSelectedAnnotationType({selectedAnnotationType: this.selectedAnnotationType}));
    this.store.dispatch(AnnotationActions.setAnnotationContent({annotationContent: this.text}));
  }

}
