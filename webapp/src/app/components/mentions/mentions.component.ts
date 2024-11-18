import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { State } from '../../pages/components/annotations/pdf-annotation/state/annotation.reducer';
import { VideoState } from '../../pages/components/annotations/video-annotation/state/video.reducer';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  switchMap,
  tap,
} from 'rxjs';
import * as AnnotationSelectors from '../../pages/components/annotations/pdf-annotation/state/annotation.reducer';
import { NotificationsService } from 'src/app/services/notifications.service';
import { getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';
@Component({
  selector: 'app-mentions',
  templateUrl: './mentions.component.html',
  styleUrls: ['./mentions.component.css'],
})
export class MentionsComponent implements OnInit {
  nameWithEmail$: Observable<{ name: string; username: string; userId: string }[]>;
  onUserInput: BehaviorSubject<string> = new BehaviorSubject<string>('');
  onUserInput$ = this.onUserInput.asObservable();
  filteredUsernamesFromAnnotationAndRepliesAuthors$: Observable<
    { name: string; username: string; userId: string }[]
  >;
  filteredEnrolledUsernames$: Observable<
    { name: string; username: string; userId: string }[]
  >;
  filteredUserNames$: Observable<
    { name: string; username: string; userId: string }[]
  >;
  mentionedUsers: { name: string; username: string; userId: string }[] = [];
  courseId: string;
  content: string = '';

  constructor(
    protected store: Store<State>,
    protected notificationService: NotificationsService
  ) {}

  public ngOnInit() {
    this.mentionedUsers = [];
    
    this.store.select(getCurrentCourseId).subscribe((courseId) => {
      this.courseId = courseId;
    });

    this.nameWithEmail$ = this.store.select(
      AnnotationSelectors.getUnionOfAnnotationAndReplyAuthors
    );
    this.filteredUsernamesFromAnnotationAndRepliesAuthors$ = combineLatest([
      this.nameWithEmail$,
      this.onUserInput$,
    ]).pipe(
      map(([nameWithEmails, onUserInput]) => {
        return nameWithEmails.filter((nameWithEmail) =>
          (nameWithEmail.name + ' ' + nameWithEmail.username)
            .toLowerCase()
            .includes(onUserInput.toLowerCase())
        );
      })
    );

    this.filteredEnrolledUsernames$ = this.onUserInput$.pipe(
      switchMap((input) => {
        /*         if (input.replace(/<\/?[^>]+(>|$)/g, '') == '') {
          return [];
        } */
        return this.notificationService.getUserNames({
          partialString: input,
          courseId: this.courseId,
        }).pipe(
          map(users => users.map(user => ({
            name: user.name,
            username: user.username, // Assuming you want to map email to username
            userId: user.userId
          })))
        );
      })
    );

    this.filteredUserNames$ = combineLatest([
      this.filteredUsernamesFromAnnotationAndRepliesAuthors$,
      this.filteredEnrolledUsernames$,
    ]).pipe(
      map(([frontend, backend]) => {
        let namesWithEmails: Map<string, { name: string; username: string }> =
          new Map<string, { name: string; username: string }>();
         
        frontend.forEach((user) => {

          namesWithEmails.set(user.userId, {
            name: user.name,
            username: user.username,
          });
        });
        backend.forEach((user) => {
          namesWithEmails.set(user.userId, {
            name: user.name,
            username: user.username,
          });
         
        });
        let arr: { name: string; username: string; userId: string }[];

        arr = Array.from(namesWithEmails, ([userId, userData]) => ({
          userId,
          ...userData,
        }));

        return arr;
      })
    );
    // this.filteredUserNames$.subscribe((userNames) => {
    //   console.log("Usernames:", userNames);
    //   // You can now work with the `userNames` array here
    // });
  }

  protected removeRepeatedUsersFromMentionsArray() {
    console.log("this.mentionedUsers", this.mentionedUsers);
    this.mentionedUsers.forEach((user) => {
      if (!this.content.includes(user.name)) {
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
    /*     if (userInput.replace(/<\/?[^>]+(>|$)/g, '') == '') {
      return;
    } */
    this.onUserInput.next(userInput);
    userInput="";
    this.onUserInput.next(userInput);

  }

  selectName(mentionedUser) {
    this.mentionedUsers = [...this.mentionedUsers, mentionedUser];
  }
}
