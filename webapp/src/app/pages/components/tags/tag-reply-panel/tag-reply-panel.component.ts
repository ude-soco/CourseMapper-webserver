import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { Annotation } from 'src/app/models/Annotations';
import { State } from 'src/app/state/app.reducer';

@Component({
  selector: 'app-tag-reply-panel',
  templateUrl: './tag-reply-panel.component.html',
  styleUrls: ['./tag-reply-panel.component.css']
})
export class TagReplyPanelComponent implements OnInit, OnChanges {
  @Input() annotation: Annotation;
  repliesCount: number;
  shownRepliesCount: number = 1;
  hideRepliesButton: boolean = false;
  constructor(private store: Store<State>) {

  }

  ngOnChanges(changes: SimpleChanges): void {
    if('annotation' in changes){
      this.repliesCount = this.annotation.replies.length;
      this.showAllReplies();
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
