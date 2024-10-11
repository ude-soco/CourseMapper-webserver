import { Component, Input, Renderer2, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { Socket } from 'ngx-socket-io';
import { MenuItem, ConfirmationService, MessageService } from 'primeng/api';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  switchMap,
} from 'rxjs';
import {
  getInitials,
  computeElapsedTime,
  printTime,
} from 'src/app/_helpers/format';
import {
  Annotation,
  PdfGeneralAnnotationLocation,
} from 'src/app/models/Annotations';
import { Material } from 'src/app/models/Material';
import { Reply } from 'src/app/models/Reply';
import { Roles } from 'src/app/models/Roles';
import { User } from 'src/app/models/User';
import { getLoggedInUser } from 'src/app/state/app.reducer';
import { State } from 'src/app/state/app.state';
import * as CourseActions from 'src/app/pages/courses/state/course.actions';
import { Router } from '@angular/router';
import { getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';
import { NotificationsService } from 'src/app/services/notifications.service';
import { CourseService } from 'src/app/services/course.service';
import * as pdfjsLib from 'pdfjs-dist/build/pdf';
import { PdfviewService } from 'src/app/services/pdfview.service';
import * as AnnotationActions from 'src/app/pages/components/annotations/pdf-annotation/state/annotation.actions';
import * as NotificationActions from 'src/app/pages/components/notifications/state/notifications.actions';
import * as VideoActions from 'src/app/pages/components/annotations/video-annotation/state/video.action';

@Component({
  selector: 'app-tag-comment-item',
  templateUrl: './tag-comment-item.component.html',
  styleUrls: ['./tag-comment-item.component.css'],
  providers: [ConfirmationService],
})
export class TagCommentItemComponent {
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
  loggedInUser: User;
  annotationOptions: MenuItem[];
  isEditing: boolean = false;
  updatedAnnotation: string;
  selectedMaterial: Material;
  isShowAnnotationsOnVideo: boolean;
  blueLikeButtonEnabled: boolean = false;
  blueDislikeButtonEnabled: boolean = false;
  PDFAnnotationLocation: [number, number] = [1, 1];
  VideoAnnotationLocation: [number, number] = [0, 0];
  showAllPDFAnnotations$: Observable<boolean>;
  sendButtonDisabled: boolean = true;
  Roles = Roles;

  nameWithEmail$: Observable<{ name: string; email: string; userId: string }[]>;
  onUserInput: BehaviorSubject<string> = new BehaviorSubject<string>('');
  onUserInput$ = this.onUserInput.asObservable();
  filteredUsernamesFromAnnotationAndRepliesAuthors$: Observable<
    { name: string; email: string; userId: string }[]
  >;
  filteredEnrolledUsernames$: Observable<
    { name: string; email: string; userId: string }[]
  >;
  filteredUserNames$: Observable<
    { name: string; email: string; userId: string }[]
  >;
  mentionedUsers: { name: string; email: string; userId: string }[] = [];
  courseId: string;

  constructor(
    private store: Store<State>,
    private socket: Socket,
    private confirmationService: ConfirmationService,
    private messageService: MessageService,
    private renderer: Renderer2,
    private router: Router,
    private notificationService: NotificationsService,
    private courseService: CourseService,
    private pdfviewService: PdfviewService
  ) {
    this.store.select(getLoggedInUser).subscribe((user) => {
      this.loggedInUser = user;
    });
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
  }

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
      if (this.annotation.tool.type == 'annotation') {
        this.showAnnotationInMaterial = false;
      } else {
        this.showAnnotationInMaterial = true;
      }
      this.socket.on(
        this.annotation._id,
        (payload: {
          eventType: string;
          annotation: Annotation;
          reply: Reply;
        }) => {
          this.store.dispatch(
            CourseActions.updateAnnotationsForSelectedTag({ payload: payload })
          );
        }
      );
      this.isEditing = false;
      if (this.annotation.likes.some((like) => this.loggedInUser.id === like)) {
        this.blueLikeButtonEnabled = true;
      } else {
        this.blueLikeButtonEnabled = false;
      }
      if (
        this.annotation.dislikes.some((like) => this.loggedInUser.id === like)
      ) {
        this.blueDislikeButtonEnabled = true;
      } else {
        this.blueDislikeButtonEnabled = false;
      }
    }
  }

  ngOnInit(): void {
    this.setMenuItems();

    this.mentionedUsers = [];
    this.store.select(getCurrentCourseId).subscribe((courseId) => {
      this.courseId = courseId;
    });

    this.filteredEnrolledUsernames$ = this.onUserInput$.pipe(
      switchMap((input) => {
        /*     if (input.replace(/<\/?[^>]+(>|$)/g, '') == '') {
          return [];
        } */
        return this.notificationService.getUserNames({
          partialString: input,
          courseId: this.courseId,
        });
      })
    );

    /*     this.filteredUserNames$ = combineLatest([
      this.filteredUsernamesFromAnnotationAndRepliesAuthors$,
      this.filteredEnrolledUsernames$,
    ]).pipe(
      map(([frontend, backend]) => {
        let namesWithEmails: Map<string, { name: string; email: string }> =
          new Map<string, { name: string; email: string }>();
        frontend.forEach((user) => {
          namesWithEmails.set(user.userId, {
            name: user.name,
            email: user.email,
          });
        });
        backend.forEach((user) => {
          namesWithEmails.set(user.userId, {
            name: user.name,
            email: user.email,
          });
        });
        let arr: { name: string; email: string; userId: string }[];

        arr = Array.from(namesWithEmails, ([userId, userData]) => ({
          userId,
          ...userData,
        }));
        return arr;
      })
    ); */
  }

  onReplyContentChange() {
    if (this.replyContent.replace(/<\/?[^>]+(>|$)/g, '') == '') {
      this.sendButtonDisabled = true;
    } else {
      this.sendButtonDisabled = false;
    }
  }

  sendReply() {
    if (this.replyContent.replace(/<\/?[^>]+(>|$)/g, '') == '') {
      this.sendButtonDisabled = true;
      window.alert('Cannot Send Empty Reply');
      return;
    }
    this.reply = {
      content: this.replyContent,
    };
    this.removeRepeatedUsersFromMentionsArray();
    this.store.dispatch(
      CourseActions.postReply({
        reply: this.reply,
        annotation: this.annotation,
        mentionedUsers: this.mentionedUsers,
      })
    );
    this.reply = null;
    this.replyContent = null;
  }

  likeAnnotation() {
    this.store.dispatch(
      CourseActions.likeAnnotation({ annotation: this.annotation })
    );
  }

  dislikeAnnotation() {
    this.store.dispatch(
      CourseActions.dislikeAnnotation({ annotation: this.annotation })
    );
  }

  printTime = printTime;

  showAnnotationOnMaterial(annotation: Annotation) {
    console.log(annotation);
    if (
      annotation.location.type == 'Current Slide' ||
      annotation.location.type == 'All Slides' ||
      annotation.location.type == 'Slide Range'
    ) {
      console.log(annotation.materialType);
      this.courseService.navigatingToMaterial = true;
      if (
        this.router.url.includes(
          '/course/' +
            annotation.courseId +
            '/channel/' +
            annotation.channelId +
            '/material/' +
            '(material:' +
            annotation.materialId +
            `/${annotation.materialType}`
        )
      ) {
        // We are already on the page containing the material and annotation
        // Scroll to the annotation
        const elementToScrollTo = document.getElementById(
          `annotation-${annotation._id}`
        );
        if (elementToScrollTo) {
          elementToScrollTo.scrollIntoView();
          // Scroll may take some time, so set the hash after a delay
          setTimeout(() => {
            window.location.hash = `#annotation-${annotation._id}`;
            console.log('1', window.location.hash);
            // Apply CSS styling to the annotation
            $(window.location.hash).css(
              'box-shadow',
              '0 0 25px rgba(83, 83, 255, 1)'
            );
            // Remove CSS styling after 5 seconds
            setTimeout(() => {
              $(window.location.hash).css('box-shadow', 'none');
            }, 5000);
          }, 100);
        }
      } else {
        // We need to navigate to the page containing the material and annotation

        // const targetURL = `/course/${annotation.courseId}/channel/${annotation.channelId}/material/(material:${annotation.materialId}/${annotation.materialType}?page=${annotation.location.startPage || 1})#annotation-${annotation._id}`;

        this.router.navigateByUrl(
          '/course/' +
            annotation.courseId +
            '/channel/' +
            annotation.channelId +
            '/material/(material:' +
            annotation.materialId +
            '/' +
            annotation.materialType +
            ')' +
            '#annotation-' +
            annotation._id
        );
        this.store.dispatch(
          NotificationActions.setCurrentlySelectedFollowingAnnotation({
            followingAnnotation: {
              annotationId: annotation._id,
              materialId: annotation.materialId,
              materialType: 'pdf',
              content: annotation.content,
              topicId: '',
              channelId: annotation.channelId,
              courseId: annotation.courseId,
              userId: annotation.author.userId,
              isFollowing: false,
              _id: annotation._id,
              startPage: annotation.location.startPage,
            },
          })
        );
        return;
      }
    }
    if (
      annotation.location.type == 'time' 
    ) {
      console.log(annotation.materialType);
      this.courseService.navigatingToMaterial = true;
      if (
        this.router.url.includes(
          '/course/' +
            annotation.courseId +
            '/channel/' +
            annotation.channelId +
            '/material/' +
            '(material:' +
            annotation.materialId +
            `/${annotation.materialType}`
        )
      ) {
        // We are already on the page containing the material and annotation
        // Scroll to the annotation
        const elementToScrollTo = document.getElementById(
          `annotation-${annotation._id}`
        );
        if (elementToScrollTo) {
          elementToScrollTo.scrollIntoView();
          // Scroll may take some time, so set the hash after a delay
          setTimeout(() => {
            window.location.hash = `#annotation-${annotation._id}`;
            // Apply CSS styling to the annotation
            $(window.location.hash).css(
              'box-shadow',
              '0 0 25px rgba(83, 83, 255, 1)'
            );
            // Remove CSS styling after 5 seconds
            setTimeout(() => {
              $(window.location.hash).css('box-shadow', 'none');
            }, 5000);
          }, 100);
        }
      } else {
        // We need to navigate to the page containing the material and annotation

        // const targetURL = `/course/${annotation.courseId}/channel/${annotation.channelId}/material/(material:${annotation.materialId}/${annotation.materialType}?page=${annotation.location.startPage || 1})#annotation-${annotation._id}`;

        this.router.navigateByUrl(
          '/course/' +
            annotation.courseId +
            '/channel/' +
            annotation.channelId +
            '/material/(material:' +
            annotation.materialId +
            '/' +
            annotation.materialType +
            ')' +
            '#annotation-' +
            annotation._id
        );
        this.store.dispatch(
          NotificationActions.setCurrentlySelectedFollowingAnnotation({
            followingAnnotation: {
              annotationId: annotation._id,
              materialId: annotation.materialId,
              materialType: 'video',
              content: annotation.content,
              topicId: '',
              channelId: annotation.channelId,
              courseId: annotation.courseId,
              userId: annotation.author.userId,
              isFollowing: false,
              _id: annotation._id,
              from: annotation.location.from,
              
            },
          })
        );
        this.store.dispatch(
          VideoActions.SetSeekVideo({
            seekVideo: [annotation.location.from,annotation.location.from],
          })
        );
        this.store.dispatch(
          VideoActions.SetCurrentTime({
            currentTime: annotation.location.from,
          })
        );
        return;
      }
    }
  }

  onDeleteAnnotation() {
    this.confirmationService.confirm({
      message: `Are you sure you want to delete this annotation`,
      header: 'Delete Confirmation',
      icon: 'pi pi-info-circle',
      accept: (e) => (
        this.store.dispatch(
          CourseActions.deleteAnnotation({ annotation: this.annotation })
        ),
        this.messageService.add({
          key: 'annotation-toast',
          severity: 'info',
          summary: 'Success',
          detail: 'Annotation successfully deleted!',
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

  onEditAnnotation() {
    this.isEditing = true;
    this.updatedAnnotation = this.annotation.content;
    this.setMenuItems();
  }

  dispatchUpdatedAnnotation() {
    let updatedAnnotation = {
      ...this.annotation,
      content: this.updatedAnnotation,
    };
    this.store.dispatch(
      CourseActions.editAnnotation({ annotation: updatedAnnotation })
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
          detail: 'Annotation edit discarded',
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

  setMenuItems() {
    this.annotationOptions = [
      {
        label: 'Edit',
        icon: 'pi pi-pencil',
        disabled:
          this.loggedInUser?.id !== this.annotation?.author?.userId &&
          !this.isEditing,
        command: () => this.onEditAnnotation(),
      },
      {
        label: 'Delete',
        icon: 'pi pi-times',
        disabled:
          this.loggedInUser?.id !== this.annotation?.author?.userId &&
          !this.isEditing,
        command: () => this.onDeleteAnnotation(),
      },
    ];
  }

  protected removeRepeatedUsersFromMentionsArray() {
    this.mentionedUsers.forEach((user) => {
      if (!this.replyContent.includes(user.name)) {
        this.mentionedUsers.splice(this.mentionedUsers.indexOf(user), 1);
      }
    });

    //Remove repeated users from mentionedUsers array
    this.mentionedUsers = this.mentionedUsers.filter(
      (user, index, self) =>
        index === self.findIndex((t) => t.userId === user.userId)
    );
  }

  searchUserNames(userInput: string) {
    /* if (userInput.replace(/<\/?[^>]+(>|$)/g, '') == '') {
      return;
    } */
    this.onUserInput.next(userInput);
  }

  selectName(mentionedUser) {
    this.mentionedUsers = [...this.mentionedUsers, mentionedUser];
  }

  linkifyText(text: string): string {
    const linkRegex =
      /(\b(https?|ftp|file):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gi;
    const hashtagRegex = /(^|\s)(#[a-z\d-]+)/gi;
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

    let linkedHtml = linkedText
      .replace(
        linkRegex,
        '<a class="cursor-pointer font-medium text-blue-500 dark:text-blue-500 hover:underline break-all" href="$1" target="_blank">$1</a>'
      )
      .replace(hashtagRegex, (match, before, hashtag) => {
        const tagLink = `/course/${
          this.annotation?.courseId
        }/tag/${encodeURIComponent(hashtag)}`;
        const tagHtml = `<a class="cursor-pointer font-medium text-blue-500 dark:text-blue-500 hover:underline break-all" href="${tagLink}" onClick="handleTagClick(event, '${hashtag}')"><strong>${hashtag}</strong></a>`;
        return `${before}${tagHtml}`;
      })
      .replace(newlineRegex, '<br>');

    let mentionedUsers = this.annotation.mentionedUsers;
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
