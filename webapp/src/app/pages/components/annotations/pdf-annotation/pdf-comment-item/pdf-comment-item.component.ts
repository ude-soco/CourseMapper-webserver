import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { computeElapsedTime, getInitials } from 'src/app/format';
import { Annotation } from 'src/app/models/Annotations';
import { Reply } from 'src/app/models/Reply';
import { getAnnotationsForMaterial, State } from '../state/annotation.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'

@Component({
  selector: 'app-pdf-comment-item',
  templateUrl: './pdf-comment-item.component.html',
  styleUrls: ['./pdf-comment-item.component.css'],
})
export class PdfCommentItemComponent implements OnInit, OnChanges {
  @Input() annotation: Annotation;
  reply: Reply;
  replyContent: string;
  annotationInitials?: string;
  annotationElapsedTime?: string;
  toggleReplyBox: boolean = false;

  constructor(private store: Store<State>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if('annotation' in changes){
      this.annotationInitials = getInitials(this.annotation?.author?.name);
      this.annotationElapsedTime = computeElapsedTime(this.annotation?.createdAt)
    }
  }

  ngOnInit(): void {}

  toggleComment(){
    this.toggleReplyBox = !this.toggleReplyBox;
  }

  sendReply(){
    this.reply = {
      content: this.replyContent
    }
    this.store.dispatch(AnnotationActions.postReply({reply: this.reply, annotation: this.annotation}));
    this.reply = null;
    this.replyContent = null
    this.toggleComment();
  }
}
