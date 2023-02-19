import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { MenuItem } from 'primeng/api';
import { computeElapsedTime, getInitials } from 'src/app/format';
import { Annotation } from 'src/app/models/Annotations';
import { Reply } from 'src/app/models/Reply';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'
import { State } from '../state/annotation.reducer';

@Component({
  selector: 'app-pdf-reply-item',
  templateUrl: './pdf-reply-item.component.html',
  styleUrls: ['./pdf-reply-item.component.css']
})
export class PdfReplyItemComponent implements OnInit, OnChanges {
  @Input() reply: Reply;
  replyInitials?: string;
  replyElapsedTime?: string;
  likesCount: number;
  dislikesCount: number;
  annotationOptions: MenuItem[] = [
    {
      label: 'Edit',
      icon: 'pi pi-pencil',
      // command: () => this.onRenameTopic(),
    },
    {
      label: 'Delete',
      icon: 'pi pi-times',
      // command: () => this.onDeleteTopic(),
    },
    {
      label: 'Report',
      icon: 'pi pi-flag-fill',
      // command: () => this.onDeleteTopic(),
    },
  ];
  constructor(private store: Store<State>) {

   }
  ngOnChanges(changes: SimpleChanges): void {
    if('reply' in  changes){
      this.replyInitials = getInitials(this.reply?.author?.name);
      this.replyElapsedTime = computeElapsedTime(this.reply?.createdAt);
      this.likesCount = this.reply?.likes?.length;
      this.dislikesCount = this.reply?.dislikes?.length;
    }
  }

  ngOnInit(): void {
  }

  likeReply(){
    this.store.dispatch(AnnotationActions.likeReply({reply: this.reply}));
  }

  dislikeReply(){
    this.store.dispatch(AnnotationActions.dislikeReply({reply: this.reply}));
  }

}
