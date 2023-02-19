import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { computeElapsedTime, getInitials } from 'src/app/format';
import { Annotation } from 'src/app/models/Annotations';
import { Reply } from 'src/app/models/Reply';
import { getAnnotationsForMaterial, State } from '../state/annotation.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import { MenuItem } from 'primeng/api';

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
  likesCount: number;
  dislikesCount: number;
  annotationColor: string;
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

  constructor(private store: Store<State>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if ('annotation' in changes) {
      this.annotationInitials = getInitials(this.annotation?.author?.name);
      this.annotationElapsedTime = computeElapsedTime(
        this.annotation?.createdAt
      );
      this.likesCount = this.annotation.likes.length;
      this.dislikesCount = this.annotation.dislikes.length;
      switch (this.annotation.type) {
        case 'Note':
          this.annotationColor = '#70b85e';
          break;
        case 'Question':
          this.annotationColor = '#FFAB5E';
          break;
        case 'External Resource':
          this.annotationColor = '#B85E94';
          break;
      }
    }
  }

  ngOnInit(): void {}

  sendReply() {
    this.reply = {
      content: this.replyContent,
    };
    this.store.dispatch(
      AnnotationActions.postReply({
        reply: this.reply,
        annotation: this.annotation,
      })
    );
    this.reply = null;
    this.replyContent = null;
  }

  likeAnnotation() {
    this.store.dispatch(
      AnnotationActions.likeAnnotation({ annotation: this.annotation })
    );
  }

  dislikeAnnotation() {
    this.store.dispatch(
      AnnotationActions.dislikeAnnotation({ annotation: this.annotation })
    );
  }
}
