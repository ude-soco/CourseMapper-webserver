import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Renderer2,
  SimpleChanges,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { MenuItem, Message, MessageService, PrimeNGConfig } from 'primeng/api';
import { computeElapsedTime, getInitials } from 'src/app/_helpers/format';
import { Annotation } from 'src/app/models/Annotations';
import { Reply } from 'src/app/models/Reply';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import { State } from '../state/annotation.reducer';
import { SocketIoModule, SocketIoConfig, Socket } from 'ngx-socket-io';
import { User } from 'src/app/models/User';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { NgIf } from '@angular/common';
import { Subscription } from 'rxjs';
import { Roles } from 'src/app/models/Roles';
import { ConfirmationService } from 'primeng/api';
import * as $ from 'jquery';

@Component({
  selector: 'app-pdf-reply-item',
  templateUrl: './pdf-reply-item.component.html',
  styleUrls: ['./pdf-reply-item.component.css'],
  providers: [ConfirmationService],
})
export class PdfReplyItemComponent
  implements OnInit, OnChanges, OnDestroy, AfterViewInit
{
  @Input() reply: Reply;
  loggedInUser: User;
  replyInitials?: string;
  replyElapsedTime?: string;
  likesCount: number;
  dislikesCount: number;
  annotationOptions: MenuItem[];
  subscription: Subscription;
  isEditing: boolean = false;
  updatedReply: string;
  blueLikeButtonEnabled: boolean = false;
  blueDislikeButtonEnabled: boolean = false;
  Roles = Roles;
  msgs: Message[] = [];

  constructor(
    private store: Store<State>,
    private socket: Socket,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private renderer: Renderer2
  ) {
    this.subscription = this.store
      .select(getLoggedInUser)
      .subscribe((user) => (this.loggedInUser = user));
  }

  ngAfterViewInit(): void {
    const moreSpan = document.querySelectorAll('.clickable-text');
    moreSpan.forEach((clickableText) => {
      clickableText.addEventListener('click', (event) => {
        if (clickableText.matches('.show-more')) {
          const hiddenText = (event.target as HTMLElement)
            .nextSibling as HTMLSpanElement;
          const showMoreWord =
            hiddenText.previousElementSibling as HTMLSpanElement;
          const showLessWord = hiddenText.nextElementSibling as HTMLSpanElement;
          hiddenText.style.display = 'inline';
          showLessWord.style.display = 'inline';
          showMoreWord.style.display = 'none';
        } else if (clickableText.matches('.show-less')) {
          const hiddenText = (event.target as HTMLElement)
            .previousSibling as HTMLSpanElement;
          const showMoreWord =
            hiddenText.previousElementSibling as HTMLSpanElement;
          const showLessWord = hiddenText.nextElementSibling as HTMLSpanElement;
          hiddenText.style.display = 'none';
          showMoreWord.style.display = 'inline';
          showLessWord.style.display = 'none';
        }
      });
    });

    const url = window.location.href;

    if (url.includes('#reply-')) {
      const replyId = url.match(/#reply-(.+)/)[1];
      if (replyId === this.reply._id) {
        const elementToScrollTo = document.getElementById(`reply-${replyId}`);

        // Scroll to the element
        window.location.hash = '#reply-' + replyId;
        //elementToScrollTo.scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'start' });

        setTimeout(function () {
          elementToScrollTo.scrollIntoView({
            behavior: 'smooth',
            block: 'end',
            inline: 'start',
          });
          $(window.location.hash).css(
            'box-shadow',
            '0 0 25px rgba(83, 83, 255, 1)'
          );
          setTimeout(function () {
            $(window.location.hash).css('box-shadow', 'none');
          }, 4000);
        }, 1000);
      }
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ('reply' in changes) {
      this.isEditing = false;
      this.replyInitials = getInitials(this.reply?.author?.name);
      this.replyElapsedTime = computeElapsedTime(this.reply?.createdAt);
      this.likesCount = this.reply?.likes?.length;
      this.dislikesCount = this.reply?.dislikes?.length;
      this.socket.on(
        this.reply?._id,
        (payload: {
          eventType: string;
          likes: number;
          dislikes: number;
          reply: Reply;
        }) => {
          this.likesCount = payload.likes;
          this.dislikesCount = payload.dislikes;
          if (
            payload.reply.likes.some((like) => this.loggedInUser.id === like)
          ) {
            this.blueLikeButtonEnabled = true;
          } else {
            this.blueLikeButtonEnabled = false;
          }
          if (
            payload.reply.dislikes.some((like) => this.loggedInUser.id === like)
          ) {
            this.blueDislikeButtonEnabled = true;
          } else {
            this.blueDislikeButtonEnabled = false;
          }
        }
      );

      if (this.reply?.likes?.some((like) => this.loggedInUser.id === like)) {
        this.blueLikeButtonEnabled = true;
      } else {
        this.blueLikeButtonEnabled = false;
      }
      if (this.reply?.dislikes?.some((like) => this.loggedInUser.id === like)) {
        this.blueDislikeButtonEnabled = true;
      } else {
        this.blueDislikeButtonEnabled = false;
      }

      this.annotationOptions = [
        {
          label: 'Edit',
          icon: 'pi pi-pencil',
          disabled:
            this.loggedInUser?.id !== this.reply?.author?.userId ||
            this.isEditing,
          command: () => this.onEditReply(),
        },
        {
          label: 'Delete',
          icon: 'pi pi-times',
          disabled:
            this.loggedInUser?.id !== this.reply?.author?.userId &&
            !this.isEditing,
          command: () => this.onDeleteConfirmation(),
        },
      ];
    }
  }

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.socket.removeAllListeners(this.reply?._id);
  }
  adjustTextarea(event: any): void {
    const textarea = event.target;
    textarea.style.height = 'auto';  // Reset the height to auto
    textarea.style.height = textarea.scrollHeight + 'px';  // Set the height to fit the content
  }
  likeReply() {
    this.store.dispatch(AnnotationActions.likeReply({ reply: this.reply }));
  }

  dislikeReply() {
    this.store.dispatch(AnnotationActions.dislikeReply({ reply: this.reply }));
  }

  onDeleteConfirmation() {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this reply`,
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: (e) => (
        this.onDeleteReply(),
        this.messageService.add({
          key: 'annotation-toast',
          severity: 'success',
          summary: 'Success',
          detail: 'Reply successfully deleted',
        })
      ),
      reject: () => {
        return;
      },
    });

    setTimeout(() => {
      const rejectButtons = Array.from(
        document.getElementsByClassName('p-confirm-dialog-reject')
      ) as HTMLElement[];
      rejectButtons.forEach((button) =>
        this.renderer.addClass(button, 'p-button-outlined')
      );
    }, 0);
  }

  onDeleteReply() {
    this.store.dispatch(AnnotationActions.deleteReply({ reply: this.reply }));
  }

  onEditReply() {
    this.isEditing = true;
    this.updatedReply = this.reply.content;
  }

  dispatchUpdatedReply() {
    this.store.dispatch(
      AnnotationActions.editReply({
        reply: this.reply,
        updatedReply: this.updatedReply,
      })
    );
    this.isEditing = false;
  }

  cancelEditing() {
    this.confirmationService.confirm({
      message: `Are you sure you want to discard this draft`,
      header: 'Confirmation',
      icon: 'pi pi-info-circle',
      accept: (e) => (
        (this.isEditing = false),
        this.messageService.add({
          key: 'annotation-toast',
          severity: 'info',
          summary: 'Info',
          detail: 'Reply edit discarded',
        })
      ),
      reject: () => {
        return;
      },
    });

    setTimeout(() => {
      const rejectButtons = Array.from(
        document.getElementsByClassName('p-confirm-dialog-reject')
      ) as HTMLElement[];
      rejectButtons.forEach((button) =>
        this.renderer.addClass(button, 'p-button-outlined')
      );
    }, 0);
  }


  linkifyText(text: string): string {
    if (!text) {
      return '';
    }
    let limit = 180
    const linkRegex =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;

    const hashtagRegex = /(\s|^)(#[a-z\d-]+)/gi;
    const newlineRegex = /(\r\n|\n|\r)/gm;

    let match;
    let lastUrlEnd = -1;
    let linkedHtml
    // If the text is shorter than the limit, return the text
    if (text.length <= limit) {


       linkedHtml = text
       .replace(
         linkRegex,
         '<a class="cursor-pointer font-medium text-blue-500 dark:text-blue-500 hover:underline break-all" href="$1" target="_blank">$1</a>'
       )
       .replace(hashtagRegex, (match, before, hashtag) => {

         const tagLink = `/course/${
           this.reply?.courseId
         }/tag/${encodeURIComponent(hashtag)}`;
         const tagHtml = `<a class="cursor-pointer font-medium text-blue-500 dark:text-blue-500 hover:underline break-all" href="${tagLink}" onClick="handleTagClick(event, '${hashtag}')"><strong>${hashtag}</strong></a>`;
         return `${before}${tagHtml}`;
       })
       .replace(newlineRegex, '<br>');

     let mentionedUsers = this.reply.mentionedUsers;
     if (mentionedUsers) {
       mentionedUsers.forEach((mentionedUser) => {
         //check if the name of the mentioned user is in the linkedHtml, if so, make the name blue
         if (linkedHtml.includes(`@${mentionedUser.name}`)) {
           const userHtml = `<span class="cursor-auto font-medium text-blue-500 dark:text-blue-500  break-all" ><strong>${mentionedUser.name}</strong></span>`;
           linkedHtml = linkedHtml.replace(`@${mentionedUser.name}`, userHtml);
         }
       });
     }
       return linkedHtml;

    }
    while ((match = linkRegex.exec(text)) !== null) {
      // If the URL ends after the truncation limit
      if (match.index <= limit && match.index + match[0].length > limit) {
      console.log("match.index", match.index, )

        lastUrlEnd = match.index + match[0].length;
        break;
      }
    }
    // calculate the new truncation point
    const truncationPoint = lastUrlEnd > limit ? lastUrlEnd : limit;
    const truncatedText = text.substring(0, truncationPoint);
    const remainingText = text.substring(truncationPoint);
    const truncated = text.length > truncationPoint;
  //  if text length is more than the new truncation point with url , return the text
    if (!truncated) {

       linkedHtml = text
       .replace(
         linkRegex,
         '<a class="cursor-pointer font-medium text-blue-500 dark:text-blue-500 hover:underline break-all" href="$1" target="_blank">$1</a>'
       )
       .replace(hashtagRegex, (match, before, hashtag) => {

         const tagLink = `/course/${
           this.reply?.courseId
         }/tag/${encodeURIComponent(hashtag)}`;
         const tagHtml = `<a class="cursor-pointer font-medium text-blue-500 dark:text-blue-500 hover:underline break-all" href="${tagLink}" onClick="handleTagClick(event, '${hashtag}')"><strong>${hashtag}</strong></a>`;
         return `${before}${tagHtml}`;
       })
       .replace(newlineRegex, '<br>');

     let mentionedUsers = this.reply.mentionedUsers;
     if (mentionedUsers) {
       mentionedUsers.forEach((mentionedUser) => {
         //check if the name of the mentioned user is in the linkedHtml, if so, make the name blue
         if (linkedHtml.includes(`@${mentionedUser.name}`)) {
           const userHtml = `<span class="cursor-auto font-medium text-blue-500 dark:text-blue-500  break-all" ><strong>${mentionedUser.name}</strong></span>`;
           linkedHtml = linkedHtml.replace(`@${mentionedUser.name}`, userHtml);
         }
       });
     }
       return linkedHtml;
    }
  // If no URL ends after the truncation limit, use the new truncation point
    const linkedText = truncatedText.replace(linkRegex, '<a  target="_blank" class="text-blue-500">$&</a>') +
      '<span class="ml-1 clickable-text show-more cursor-pointer font-medium text-blue-500 dark:text-blue-500 hover:underline">...show more</span>' +
      '<span class="hidden break-all">' +
      remainingText.replace(linkRegex, '<a  target="_blank" class="text-blue-500">$&</a>') +
      '</span>' +
      '<span class="ml-1 cursor-pointer text-blue-500 dark:text-blue-500 hover:underline clickable-text show-less hidden">show less</span>';

     linkedHtml = linkedText
      .replace(
        linkRegex,
        '<a class="cursor-pointer font-medium text-blue-500 dark:text-blue-500 hover:underline break-all" href="$1" target="_blank">$1</a>'
      )
      .replace(hashtagRegex, (match, before, hashtag) => {

        const tagLink = `/course/${
          this.reply?.courseId
        }/tag/${encodeURIComponent(hashtag)}`;
        const tagHtml = `<a class="cursor-pointer font-medium text-blue-500 dark:text-blue-500 hover:underline break-all" href="${tagLink}" onClick="handleTagClick(event, '${hashtag}')"><strong>${hashtag}</strong></a>`;
        return `${before}${tagHtml}`;
      })
      .replace(newlineRegex, '<br>');

    let mentionedUsers = this.reply.mentionedUsers;
    if (mentionedUsers) {
      mentionedUsers.forEach((mentionedUser) => {
        //check if the name of the mentioned user is in the linkedHtml, if so, make the name blue
        if (linkedHtml.includes(`@${mentionedUser.name}`)) {
          const userHtml = `<span class="cursor-auto font-medium text-blue-500 dark:text-blue-500  break-all" ><strong>${mentionedUser.name}</strong></span>`;
          linkedHtml = linkedHtml.replace(`@${mentionedUser.name}`, userHtml);
        }
      });
    }
      return linkedHtml;
    }
}
