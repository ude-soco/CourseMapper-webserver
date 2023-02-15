import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { computeElapsedTime, getInitials } from 'src/app/format';
import { Annotation } from 'src/app/models/Annotations';
import { getAnnotationsForMaterial, State } from '../state/annotation.reducer';

@Component({
  selector: 'app-pdf-comment-item',
  templateUrl: './pdf-comment-item.component.html',
  styleUrls: ['./pdf-comment-item.component.css'],
})
export class PdfCommentItemComponent implements OnInit, OnChanges {
  @Input() annotation: Annotation
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
}
