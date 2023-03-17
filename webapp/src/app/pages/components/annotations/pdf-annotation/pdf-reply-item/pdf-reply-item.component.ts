import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { MenuItem } from 'primeng/api';
import { computeElapsedTime, getInitials } from 'src/app/_helpers/format';
import { Annotation } from 'src/app/models/Annotations';
import { Reply } from 'src/app/models/Reply';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions'
import { State } from '../state/annotation.reducer';
import { SocketIoModule, SocketIoConfig, Socket } from 'ngx-socket-io';
import { User } from 'src/app/models/User';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-pdf-reply-item',
  templateUrl: './pdf-reply-item.component.html',
  styleUrls: ['./pdf-reply-item.component.css']
})
export class PdfReplyItemComponent implements OnInit, OnChanges, OnDestroy {
  @Input() reply: Reply;
  loggedInUser: User
  replyInitials?: string;
  replyElapsedTime?: string;
  likesCount: number;
  dislikesCount: number;
  annotationOptions: MenuItem[];
  subscription: Subscription;
  isEditing: boolean = false;
  updatedReply: string;

  constructor(private store: Store<State>, private socket: Socket) {

   }

  ngOnChanges(changes: SimpleChanges): void {
    if('reply' in  changes){
      this.isEditing = false;
      this.replyInitials = getInitials(this.reply?.author?.name);
      this.replyElapsedTime = computeElapsedTime(this.reply?.createdAt);
      this.likesCount = this.reply?.likes?.length;
      this.dislikesCount = this.reply?.dislikes?.length;
      this.subscription = this.store.select(getLoggedInUser).subscribe((user) => this.loggedInUser = user);
      this.socket.on(this.reply?._id, (payload: { eventType: string, likes: number, dislikes: number, reply: Reply }) => {
        console.log(payload);
        this.likesCount = payload.likes;
        this.dislikesCount = payload.dislikes;
      })

      this.annotationOptions = [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          disabled: this.loggedInUser?.id !== this.reply?.author?.userId || this.isEditing,
          command: () => this.onEditReply(),
        },
        {
          label: 'Delete',
          icon: 'pi pi-times',
          disabled: (this.loggedInUser?.id !== this.reply?.author?.userId) && !this.isEditing,
          command: () => this.onDeleteReply(),
        },
        {
          label: 'Report',
          icon: 'pi pi-flag-fill',
          command: () => this.onReportReply(),
        },
      ];
    }
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.socket.removeAllListeners(this.reply?._id);
  }

  likeReply(){
    this.store.dispatch(AnnotationActions.likeReply({reply: this.reply}));
  }

  dislikeReply(){
    this.store.dispatch(AnnotationActions.dislikeReply({reply: this.reply}));
  }

  onDeleteReply(){
    this.store.dispatch(AnnotationActions.deleteReply({reply: this.reply}));
  }

  onEditReply(){
    this.isEditing = true;
    this.updatedReply = this.reply.content;
  }

  dispatchUpdatedReply(){
    this.store.dispatch(AnnotationActions.editReply({reply: this.reply, updatedReply: this.updatedReply}));
    this.isEditing = false;
  }

  cancelEditing(){
    this.isEditing = false;
  }

  onReportReply(){}

}
