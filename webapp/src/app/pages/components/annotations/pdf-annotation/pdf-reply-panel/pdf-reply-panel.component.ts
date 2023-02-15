import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Annotation } from 'src/app/models/Annotations';
import { Reply } from 'src/app/models/Reply';

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
  constructor() {}

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
    this.hideRepliesButton = false;
  }
}
