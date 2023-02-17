import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { Annotation } from 'src/app/models/Annotations';
import { Reply } from 'src/app/models/Reply';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'
import { State } from '../state/annotation.reducer';

@Component({
  selector: 'app-pdf-reply-panel',
  templateUrl: './pdf-reply-panel.component.html',
  styleUrls: ['./pdf-reply-panel.component.css'],
})
export class PdfReplyPanelComponent implements OnInit, OnChanges  {
  @Input() annotation: Annotation;
  repliesCount: number;
  shownRepliesCount: number = 1;
  hideRepliesButton: boolean = false;
  constructor(private store: Store<State>) {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if('annotation' in changes){
      this.repliesCount = this.annotation.replies.length
    }
  }

  ngOnInit(): void {}

  showAllReplies(){
    this.shownRepliesCount = this.repliesCount;
    this.hideRepliesButton = true;
  }

  hideReplies(){
    this.shownRepliesCount = 1;
    this.hideRepliesButton = false
  }
}
