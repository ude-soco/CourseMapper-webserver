import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { State } from '../pdf-annotation/state/annotation.reducer';
import { VideoState } from '../video-annotation/state/video.reducer';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  map,
  switchMap,
  tap,
} from 'rxjs';
import * as AnnotationSelectors from '../pdf-annotation/state/annotation.reducer';
import { NotificationsService } from 'src/app/services/notifications.service';
import { getCurrentCourseId } from 'src/app/pages/courses/state/course.reducer';
@Component({
  selector: 'app-mentions',
  templateUrl: './mentions.component.html',
  styleUrls: ['./mentions.component.css'],
})
export class MentionsComponent implements OnInit {
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
      tap(([username, input]) => {
        console.log('pipeline running again!');
        console.log(username);
        console.log(input);
      }),
      map(([nameWithEmails, onUserInput]) => {
        return nameWithEmails.filter((nameWithEmail) =>
          (nameWithEmail.name + ' ' + nameWithEmail.email)
            .toLowerCase()
            .includes(onUserInput.toLowerCase())
        );
      })
    );

    this.filteredEnrolledUsernames$ = this.onUserInput$.pipe(
      tap((input) => {
        console.log('input is: ' + input);
      }),
      tap((input) => {
        console.log('courseId is: ' + this.courseId);
      }),
      switchMap((input) => {
        return this.notificationService
          .getUserNames({ partialString: input, courseId: this.courseId })
          .pipe(
            tap((users) => {
              console.log('backend pipeline running!');
              console.log(users);
            })
          );
      })
    );

    this.filteredUserNames$ = combineLatest([
      this.filteredUsernamesFromAnnotationAndRepliesAuthors$,
      this.filteredEnrolledUsernames$,
    ]).pipe(
      tap(([frontend, backend]) => {
        console.log('frontend is: ');
        console.log(frontend);
        console.log('backend is: ');
        console.log(backend);
      }),
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
        console.log(namesWithEmails);
        arr = Array.from(namesWithEmails, ([userId, userData]) => ({
          userId,
          ...userData,
        }));
        return arr;
      })
    );
  }

  protected removeRepeatedUsersFromMentionsArray() {
    this.mentionedUsers.forEach((user) => {
      if (!this.content.includes(user.name)) {
        this.mentionedUsers.splice(this.mentionedUsers.indexOf(user), 1);
      }
    });
    console.log('test');

    //Remove repeated users from mentionedUsers array
    this.mentionedUsers = this.mentionedUsers.filter(
      (user, index, self) =>
        index === self.findIndex((t) => t.userId === user.userId)
    );
    console.log('test');
  }

  searchUserNames(userInput: string) {
    console.log(userInput);
    this.onUserInput.next(userInput);
  }

  selectName(mentionedUser) {
    console.log(mentionedUser);
    this.mentionedUsers = [...this.mentionedUsers, mentionedUser];
    console.log(this.mentionedUsers);
  }
}
