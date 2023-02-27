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
import { getAnnotationsForMaterial, getCurrentPdfPage, State } from '../state/annotation.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import { MenuItem } from 'primeng/api';
import * as $ from 'jquery';
import { SocketIoModule, SocketIoConfig, Socket } from 'ngx-socket-io';
import { User } from 'src/app/models/User';
import { getLoggedInUser } from 'src/app/state/app.reducer';
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
  currentPage: number;
  showAnnotationInMaterial: boolean;
  loggedInUser: User
  annotationOptions: MenuItem[];
  isEditing: boolean = false;
  updatedAnnotation: string;

  constructor(private store: Store<State>, private socket: Socket) {
    this.store.select(getCurrentPdfPage).subscribe((currentPage) => {
      this.currentPage = currentPage;
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('annotation' in changes) {
      this.annotationInitials = getInitials(this.annotation?.author?.name);
      this.annotationElapsedTime = computeElapsedTime(this.annotation?.createdAt);
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
      if(this.annotation.tool.type == "annotation"){
        this.showAnnotationInMaterial = false;
      }
      else{
        this.showAnnotationInMaterial = true;
      }
      this.socket.on(this.annotation._id, (payload: { eventType: string, annotation: Annotation, reply: Reply }) => {
        console.log('payload = ', payload)
        this.store.dispatch(AnnotationActions.updateAnnotationsOnSocketEmit({payload: payload}));
      })
      this.isEditing = false;
    }
  }

  ngOnInit(): void {
    this.store.select(getLoggedInUser).subscribe((user) => {this.loggedInUser = user;});
    this.setMenuItems();
  }

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

  showAnnotationOnMaterial(){
    let location= this.annotation?.location.startPage;
    if(this.currentPage != location){
      this.store.dispatch(AnnotationActions.setCurrentPdfPage({pdfCurrentPage: location}));
      if(this.currentPage == location){
        this.highlightAnnotation();
      } 
    }else{
      this.highlightAnnotation();
    }
  }

  highlightAnnotation(){
    var noHashURL = window.location.href.replace(/#.*$/, '');
    window.history.replaceState('', document.title, noHashURL)  
    if (!this.annotation._id) return;
    
    window.location.hash = "#pdfAnnotation-" + this.annotation._id;
    setTimeout(function () {
      $( window.location.hash).css('box-shadow','0 0 25px rgba(83, 83, 255, 1)')
      setTimeout(function () {
        $( window.location.hash).css('box-shadow', 'none')
          
      }, 2000);
    }, 100);
  }

  onDeleteAnnotation(){
    this.store.dispatch(AnnotationActions.deleteAnnotation({annotation: this.annotation}));
  }

  onEditAnnotation(){
    this.isEditing = true;
    this.updatedAnnotation = this.annotation.content;
    this.setMenuItems();
  }

  dispatchUpdatedAnnotation(){
    let updatedAnnotation = {
      ... this.annotation,
      content: this.updatedAnnotation
    }
    this.store.dispatch(AnnotationActions.editAnnotation({annotation: updatedAnnotation}));
    this.isEditing = false;
  }

  cancelEditing(){
    this.isEditing = false;
  }

  setMenuItems(){
    this.annotationOptions = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        disabled: (this.loggedInUser?.id !== this.annotation?.author?.userId) && !this.isEditing,
        command: () => this.onEditAnnotation(),
      },
      {
        label: 'Delete',
        icon: 'pi pi-times',
        disabled: (this.loggedInUser?.id !== this.annotation?.author?.userId) && !this.isEditing,
        command: () => this.onDeleteAnnotation(),
      },
      {
        label: 'Report',
        icon: 'pi pi-flag-fill',
        // command: () => this.onDeleteTopic(),
      },
    ];
  }
}
