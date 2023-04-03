import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnInit,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { computeElapsedTime, getInitials } from 'src/app/_helpers/format';
import { Annotation, PdfGeneralAnnotationLocation, PdfToolType, VideoAnnotationLocation } from 'src/app/models/Annotations';
import { Reply } from 'src/app/models/Reply';
import { getAnnotationsForMaterial, getCurrentPdfPage, getshowAllPDFAnnotations, State } from '../state/annotation.reducer';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import { ConfirmationService, MenuItem, MessageService } from 'primeng/api';
import * as $ from 'jquery';
import { SocketIoModule, SocketIoConfig, Socket } from 'ngx-socket-io';
import { User } from 'src/app/models/User';
import { printTime } from 'src/app/_helpers/format';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { Material } from 'src/app/models/Material';
import { getCurrentMaterial } from '../../../materils/state/materials.reducer';
import * as VideoActions from 'src/app/pages/components/annotations/video-annotation/state/video.action'
import { getShowAnnotations } from '../../video-annotation/state/video.reducer';
import { Observable } from 'rxjs';
import { event } from 'jquery';
import {Roles} from 'src/app/models/Roles'
@Component({
  selector: 'app-pdf-comment-item',
  templateUrl: './pdf-comment-item.component.html',
  styleUrls: ['./pdf-comment-item.component.css'],
  providers: [ConfirmationService],
})
export class PdfCommentItemComponent implements OnInit, OnChanges, AfterViewInit {
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
  selectedMaterial: Material
  isShowAnnotationsOnVideo: boolean;
  blueLikeButtonEnabled: boolean = false;
  blueDislikeButtonEnabled: boolean = false;
  PDFAnnotationLocation: [number, number] = [1,1];
  VideoAnnotationLocation: [number, number] = [0,0];
  showAllPDFAnnotations$: Observable<boolean>;
  sendButtonDisabled: boolean = true;
  Roles = Roles;

  constructor(private store: Store<State>, private socket: Socket, private confirmationService: ConfirmationService, private messageService: MessageService, private renderer: Renderer2) {
    this.store.select(getCurrentPdfPage).subscribe((currentPage) => {
      this.currentPage = currentPage;
    });

    this.store.select(getCurrentMaterial).subscribe((material) => this.selectedMaterial = material);

    this.store.select(getShowAnnotations).subscribe((isShowAnnotationsOnVideo) => this.isShowAnnotationsOnVideo = isShowAnnotationsOnVideo);
    this.store.select(getLoggedInUser).subscribe((user) => {this.loggedInUser = user;});
    this.showAllPDFAnnotations$ = this.store.select(getshowAllPDFAnnotations);
  }
  ngAfterViewInit(): void {
    const moreSpan = document.querySelectorAll('.clickable-text');
    moreSpan.forEach(clickableText => {
      clickableText.addEventListener('click', (event) => {
        if(clickableText.matches('.show-more')){
          const hiddenText = (event.target as HTMLElement).nextSibling as HTMLSpanElement;
          const showMoreWord = hiddenText.previousElementSibling as HTMLSpanElement;
          const showLessWord = hiddenText.nextElementSibling as HTMLSpanElement;
          hiddenText.style.display = 'inline';
          showLessWord.style.display = 'inline';
          showMoreWord.style.display = 'none';
        }else if(clickableText.matches('.show-less')){
          const hiddenText = (event.target as HTMLElement).previousSibling as HTMLSpanElement;
          const showMoreWord = hiddenText.previousElementSibling as HTMLSpanElement;
          const showLessWord = hiddenText.nextElementSibling as HTMLSpanElement;
          hiddenText.style.display = 'none';
          showMoreWord.style.display = 'inline';
          showLessWord.style.display = 'none';
        }
      });
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
        this.store.dispatch(AnnotationActions.updateAnnotationsOnSocketEmit({payload: payload}));
      })
      this.isEditing = false;
      if(this.annotation.likes.some((like) => this.loggedInUser.id === like)){
        this.blueLikeButtonEnabled = true;
      }else{
        this.blueLikeButtonEnabled = false;
      }
      if(this.annotation.dislikes.some((like) => this.loggedInUser.id === like)){
        this.blueDislikeButtonEnabled = true;
      }else{
        this.blueDislikeButtonEnabled = false;
      }
    }
  }

  ngOnInit(): void {
    this.setMenuItems();
    if(this.selectedMaterial.type === "pdf"){
        this.PDFAnnotationLocation[0] = (this.annotation?.location as PdfGeneralAnnotationLocation).startPage;
        this.PDFAnnotationLocation[1] = (this.annotation?.location as PdfGeneralAnnotationLocation).lastPage;
    }else{
      this.VideoAnnotationLocation[0] = (this.annotation?.location as VideoAnnotationLocation).from;
      this.VideoAnnotationLocation[1] = (this.annotation?.location as VideoAnnotationLocation).to;
    }
  }

  onReplyContentChange(){
    if(this.replyContent.replace(/<\/?[^>]+(>|$)/g, "") == ""){
      this.sendButtonDisabled = true;
    }else{
      this.sendButtonDisabled = false;
    }
  }

  sendReply() {
    if(this.replyContent.replace(/<\/?[^>]+(>|$)/g, "") == ""){
      this.sendButtonDisabled = true;
      window.alert('Cannot Send Empty Reply');
      return;
    }
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

  printTime = printTime;

  showAnnotationOnMaterial(){
    if(this.selectedMaterial.type === "pdf"){
      let location = this.annotation?.location as PdfGeneralAnnotationLocation;
      if(this.currentPage != location.startPage){
        this.store.dispatch(AnnotationActions.setCurrentPdfPage({pdfCurrentPage: location.startPage}));
        this.store.dispatch(AnnotationActions.setshowAllPDFAnnotations({showAllPDFAnnotations: false}));
        if(this.currentPage == location.startPage && this.annotation.tool.type != PdfToolType.Annotation){
          this.highlightAnnotation();
        } 
      }else{
        if(this.currentPage == location.startPage && this.annotation.tool.type != PdfToolType.Annotation){
          this.highlightAnnotation();
        } 
      }
    }else{
      if(!this.isShowAnnotationsOnVideo){
        setTimeout(() => {
          this.store.dispatch(VideoActions.SetShowAnnotations({showAnnotations: true}));
          this.store.dispatch(VideoActions.SetActiveAnnotaion({activeAnnotation: this.annotation}));
          setTimeout(() => {
            this.store.dispatch(VideoActions.SetShowAnnotations({showAnnotations: false}));
            this.store.dispatch(VideoActions.SetActiveAnnotaion({activeAnnotation: null}));
          }, 5000);
        }, 100);
      }else{
        if(this.annotation.tool.type === "annotation"){
          this.store.dispatch(VideoActions.SetSeekVideo({seekVideo: [(this.annotation.location as VideoAnnotationLocation).from, (this.annotation.location as VideoAnnotationLocation).to]}));
        }
        this.store.dispatch(VideoActions.SetActiveAnnotaion({activeAnnotation: this.annotation}));
      }
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
  this.confirmationService.confirm({
    message: `Are you sure you want to delete this annotation`,
    header: 'Delete Confirmation',
    icon: 'pi pi-info-circle',
    accept: (e) => (
      this.store.dispatch(AnnotationActions.deleteAnnotation({annotation: this.annotation})),
      this.messageService.add({key: 'annotation-toast', severity:'info', summary: 'Success', detail: 'Annotation successfully deleted!'})
    ),
    reject: () => (
      this.messageService.add({key: 'annotation-toast', severity:'info', summary: 'Info', detail: 'Annotation deletion canceled'})
    ),
  });
  
  setTimeout(() => {
    const rejectButtons = Array.from(document.getElementsByClassName('p-confirm-dialog-reject')) as HTMLElement[];
    rejectButtons.forEach(button => this.renderer.addClass(button, 'p-button-outlined'));
  }, 0);
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
  this.confirmationService.confirm({
    message: `Are you sure you want to discard this draft`,
    header: 'Confirmation',
    icon: 'pi pi-info-circle',
    accept: (e) => (
      this.isEditing = false,
      this.messageService.add({key: 'annotation-toast', severity:'info', summary: 'Info', detail: 'Annotation edit discarded'})
    ),
    reject: () => {
      return;
    }
  });
  
  setTimeout(() => {
    const rejectButtons = Array.from(document.getElementsByClassName('p-confirm-dialog-reject')) as HTMLElement[];
    rejectButtons.forEach(button => this.renderer.addClass(button, 'p-button-outlined'));
  }, 0);
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
      }
    ];
  }

  linkifyText(text: string): string {
    const linkRegex = /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    const newlineRegex = /(\r\n|\n|\r)/gm;
    const truncatedText = text.substring(0, 180);
    const truncated = text.length > 180;
    const linkedText = truncated
      ? truncatedText +
      '<span class=" ml-1 clickable-text show-more cursor-pointer font-medium text-blue-500 dark:text-blue-500 hover:underline">...show more</span>' +
          '<span class="hidden break-all">' +
          text.substring(180) +
          '</span>' +
          '<span class="ml-1 cursor-pointer text-blue-500 dark:text-blue-500 hover:underline clickable-text show-less hidden">show less</span>'
      : text;
  
    const linkedHtml = linkedText
      .replace(linkRegex, '<a class="cursor-pointer font-medium text-blue-500 dark:text-blue-500 hover:underline break-all" href="$1" target="_blank">$1</a>')
      .replace(newlineRegex, '<br>');
    return linkedHtml;
  }


  
}
