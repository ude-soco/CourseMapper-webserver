import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import {
  NotificationItem,
  NotificationMessage,
} from '../model/notification-item';

@Injectable({
  providedIn: 'root',
})
export class NotificationServiceService {
  public opened = new BehaviorSubject<boolean>(false);
  opened$ = this.opened.asObservable();

  // courseUpdateItems: NotificationItem[] = [];
  // commentsMentionedItems: NotificationItem[] = [];
  // annotationsItems: NotificationItem[] = [];

  public filteredType = new Subject<string>();
  filteredType$ = this.filteredType.asObservable();

  public isStarClicked = new BehaviorSubject<boolean>(false);
  isStarClicked$ = this.isStarClicked.asObservable();

  public allNotificationItems = new BehaviorSubject<NotificationItem[]>([]);
  allNotificationItems$ = this.allNotificationItems.asObservable();

  public courseUpdateItems = new BehaviorSubject<NotificationItem[]>([]);
  courseUpdateItems$ = this.courseUpdateItems.asObservable();

  public commentsMentionedItems = new BehaviorSubject<NotificationItem[]>([]);
  commentsMentionedItems$ = this.commentsMentionedItems.asObservable();

  public annotationsItems = new BehaviorSubject<NotificationItem[]>([]);
  annotationsItems$ = this.annotationsItems.asObservable();

  allItems = [
    {
      id: '1',
      userName: 'Baohui Deng',
      shortName: 'BA',
      isStar: true,
      message: {
        messageType: 'courseupdate',
        action: 'has created',
        courseName: 'AWT',
        topicName: 'angular',
        channelName: 'angular part 1',
        message: 'extra',
      } as NotificationMessage,
      time: 'one week ago',
      read: false,
    },
    {
      id: '2',
      userName: 'Tannaz vahidi',
      shortName: 'TA',
      isStar: false,
      message: {
        messageType: 'commentsandmentioned',
        action: 'has mentioned',
        courseName: 'AWT',
        topicName: 'database',
        channelName: 'mongodb part 1',
        message: 'extra',
      } as NotificationMessage,
      time: 'one month ago',
      read: false,
    },
    {
      id: '3',
      userName: 'Yuhong Su',
      shortName: 'SU',
      isStar: true,
      message: {
        messageType: 'courseupdate',
        action: 'has uploaded',
        courseName: 'AWT',
        topicName: 'backend',
        channelName: 'java part 2',
        message: 'extra',
      } as NotificationMessage,
      time: 'one month ago',
      read: false,
    },
    {
      id: '4',
      userName: 'Yulin Luo',
      shortName: 'YL',
      isStar: true,
      message: {
        messageType: 'annotations',
        action: 'has annotated',
        courseName: 'AWT',
        topicName: 'database',
        channelName: 'mongodb part 1',
        message: 'extra',
      } as NotificationMessage,
      time: 'one month ago',
      read: false,
    },
  ];

  constructor(private http: HttpClient) {
    this.allNotificationItems.next(this.allItems);
    this.getAnnotationsItems();
    this.getCommentsAndMentionedItems();
    this.getCourseUpdatesItems();
  }

  getAllNotification() {
    console.log('', environment.apiUrl + '/notifications');
    this.http.get(environment.apiUrl + '/notifications').subscribe((data) => {
      console.log('data', data);
    });
    return this.allNotificationItems.value;
  }

  getCourseUpdatesItems() {
    const courseUpdates = this.allNotificationItems.value.filter(
      (item) => item.message.messageType == 'courseupdate'
    );
    this.courseUpdateItems.next(courseUpdates);
    // return this.courseUpdateItems;
  }

  getCommentsAndMentionedItems() {
    const commentsUpdates = this.allNotificationItems.value.filter(
      (item) => item.message.messageType == 'commentsandmentioned'
    );
    this.commentsMentionedItems.next(commentsUpdates);
    // return this.commentsMentionedItems;
  }

  getAnnotationsItems() {
    const annotationUpdates = this.allNotificationItems.value.filter(
      (item) => item.message.messageType == 'annotations'
    );
    this.annotationsItems.next(annotationUpdates);
    // return this.annotationsItems;
  }
}
