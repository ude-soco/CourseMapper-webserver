import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject, tap } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Notification } from '../model/notification-item';
import { HTTPOptions } from '../config/config';

@Injectable({
  providedIn: 'root',
})
export class NotificationServiceService {
  public filteredType = new Subject<string>();
  filteredType$ = this.filteredType.asObservable();

  public isStarClicked = new BehaviorSubject<boolean>(false);
  isStarClicked$ = this.isStarClicked.asObservable();

  public allNotificationItems = new BehaviorSubject<Notification[]>([]);
  allNotificationItems$ = this.allNotificationItems.asObservable();

  public courseUpdateItems = new BehaviorSubject<Notification[]>([]);
  courseUpdateItems$ = this.courseUpdateItems.asObservable();

  public commentsMentionedItems = new BehaviorSubject<Notification[]>([]);
  commentsMentionedItems$ = this.commentsMentionedItems.asObservable();

  public annotationsItems = new BehaviorSubject<Notification[]>([]);
  annotationsItems$ = this.annotationsItems.asObservable();

  public showNumber = new Subject<number>();
  showNumber$ = this.showNumber.asObservable();

  public clickedMarkAllAsRead = new Subject<boolean>();
  clickedMarkAllAsRead$ = this.clickedMarkAllAsRead.asObservable();

  public isMarkAsRead = new Subject<boolean>();
  isMarkAsRead$ = this.isMarkAsRead.asObservable();

  public clickedRemoveAll = new Subject<boolean>();
  clickedRemoveAll$ = this.clickedRemoveAll.asObservable();

  public isPanelOpened = new Subject<boolean>();
  isPanelOpened$ = this.isPanelOpened.asObservable();

  public selectedTab = new Subject<any>();
  selectedTab$ = this.selectedTab.asObservable();

  constructor(private http: HttpClient) {}

  public isCourseTurnOff = new Subject<boolean>();
  isCourseTurnOff$ = this.isCourseTurnOff.asObservable();

  public isRepliesTurnOff = new Subject<boolean>();
  isRepliesTurnOff$ = this.isRepliesTurnOff.asObservable();

  public isAnnotationTurnOff = new Subject<boolean>();
  isAnnotationTurnOff$ = this.isAnnotationTurnOff.asObservable();

  getAllNotifications() {
    return this.http.get(environment.apiUrl + '/notifications');
  }

  getNotificationLists() {
    return this.allNotificationItems.value;
  }

  updateNotificationLists(lists: Notification[]) {
    this.allNotificationItems.next(lists);
    this.getCourseUpdatesItems();
    this.getCommentsAndMentionedItems();
    this.getAnnotationsItems();
  }

  getCourseUpdatesItems() {
    const courseUpdates = this.allNotificationItems.value.filter(
      (item) => item.type == 'courseupdates'
    );
    this.courseUpdateItems.next(courseUpdates);
    // return this.courseUpdateItems;
  }

  getCommentsAndMentionedItems() {
    const commentsUpdates = this.allNotificationItems.value.filter(
      (item) => item.type == 'mentionedandreplied'
    );
    this.commentsMentionedItems.next(commentsUpdates);
  }

  getAnnotationsItems() {
    const annotationUpdates = this.allNotificationItems.value.filter(
      (item) => item.type == 'annotations'
    );
    this.annotationsItems.next(annotationUpdates);
  }

  removeItem(id: string) {
    return this.http.delete(
      environment.apiUrl + '/notifications/' + id,
      HTTPOptions
    );
  }

  markItemAsRead(id: string) {
    return this.http.put(
      environment.apiUrl + '/notifications/' + id,
      HTTPOptions
    );
  }

  markItemAsStar(id: string) {
    return this.http.put(
      environment.apiUrl + '/notifications/' + id + '/star',
      HTTPOptions
    );
  }

  markAllAsRead() {
    return this.http.patch(
      environment.apiUrl + '/notifications/readAll',
      HTTPOptions
    );
  }

  removeAll() {
    return this.http.put(
      environment.apiUrl + '/notifications/deleteAll',
      HTTPOptions
    );
  }

  removeByCourseUpdates() {
    return this.http.put(
      environment.apiUrl + '/notifications/courseupdates',
      HTTPOptions
    );
  }

  removeByReplies() {
    return this.http.put(
      environment.apiUrl + '/notifications/replies',
      HTTPOptions
    );
  }

  removeByAnnotations() {
    return this.http.put(
      environment.apiUrl + '/notifications/annotations',
      HTTPOptions
    );
  }

  toggleActiveCourse() {
    return this.http.put(
      environment.apiUrl + '/notifications/deactivate/course',
      HTTPOptions
    );
  }

  toggleAnnotation() {
    return this.http.put(
      environment.apiUrl + '/notifications/deactivate/annotation',
      HTTPOptions
    );
  }

  toggleReply() {
    return this.http.put(
      environment.apiUrl + '/notifications/deactivate/reply',
      HTTPOptions
    );
  }

  turnOffNotification(userId: string) {
    return this.http.post(
      environment.apiUrl + '/notification/deactivate/' + userId,
      HTTPOptions
    );
  }

  getUserIsCourseTurnOff() {
    return this.http
      .get(environment.apiUrl + '/notification/isCourseTurnOff', HTTPOptions)
      .subscribe((data: any) => {
        this.isCourseTurnOff.next(data);
      });
  }

  getUserIsRepliesTurnOff() {
    return this.http
      .get(environment.apiUrl + '/notification/isRepliesTurnOff', HTTPOptions)
      .subscribe((data: any) => {
        this.isRepliesTurnOff.next(data);
      });
  }

  getUserIsAnnotationsTurnOff() {
    return this.http
      .get(
        environment.apiUrl + '/notification/isAnnotationTurnOff',
        HTTPOptions
      )
      .subscribe((data: any) => {
        this.isAnnotationTurnOff.next(data);
      });
  }
}
