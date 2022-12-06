import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Notification, NotificationType } from '../model/notification-item';
import { HTTPOptions } from '../config/config';
import { MenuItem } from 'primeng/api';

@Injectable({
  providedIn: 'root',
})
export class NotificationServiceService {
  public filteredType = new Subject<{
    name: string;
    type: NotificationType;
  }>();
  public filteredCourse = new Subject<{
    name: string;
    id: string;
  }>();
  filteredType$ = this.filteredType.asObservable();
  filteredCourse$ = this.filteredCourse.asObservable();

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

  public showNumber = new Subject<{ label: string; value: number }>();
  showNumber$ = this.showNumber.asObservable();

  public clickedMarkAllAsRead = new Subject<boolean>();
  clickedMarkAllAsRead$ = this.clickedMarkAllAsRead.asObservable();

  public isMarkAsRead = new Subject<boolean>();
  isMarkAsRead$ = this.isMarkAsRead.asObservable();

  public clickedRemoveAll = new Subject<boolean>();
  clickedRemoveAll$ = this.clickedRemoveAll.asObservable();

  public isPanelOpened = new Subject<boolean>();
  isPanelOpened$ = this.isPanelOpened.asObservable();

  public selectedTab = new BehaviorSubject<MenuItem>({
    id: 'default',
  });
  selectedTab$ = this.selectedTab.asObservable();

  public needUpdate = new Subject<boolean>();
  needUpdate$ = this.needUpdate.asObservable();

  public isCourseTurnOff = new Subject<boolean>();
  isCourseTurnOff$ = this.isCourseTurnOff.asObservable();

  public isRepliesTurnOff = new Subject<boolean>();
  isRepliesTurnOff$ = this.isRepliesTurnOff.asObservable();

  public isAnnotationTurnOff = new Subject<boolean>();
  isAnnotationTurnOff$ = this.isAnnotationTurnOff.asObservable();

  public loggedInTime = new BehaviorSubject<any>(null);
  loggedInTime$ = this.loggedInTime.asObservable();

  public searchString = new BehaviorSubject<any>(null);
  searchString$ = this.searchString.asObservable();

  public turnOffUser = new BehaviorSubject<string>(null);
  turnOffUser$ = this.turnOffUser.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * @function getAllNotifications
   * Get all notifications from the backend
   *
   */
  getAllNotifications() {
    return this.http.get(environment.API_URL + '/notifications');
  }

  /**
   * @function getNotificationLists
   * Return the allNotificationItems observable value
   *
   */
  getNotificationLists() {
    return this.allNotificationItems.value;
  }

  /**
   * @function getSelectedTab
   * Return the selected tab of dashboard
   * It is a observable value (eg. 'default','courseupdates','mentionedandreplied','annotations')
   *
   */
  getSelectedTab() {
    return this.selectedTab.value;
  }

  /**
   * @function updateNotificationLists
   * update the allNotificationItems observable value
   * update the commentsMentionedItems observable value
   * update the annotationsItems observable value
   * @param {lists} Notification an array of notifications
   *
   */
  updateNotificationLists(lists: Notification[]) {
    this.allNotificationItems.next(lists);
    this.getCourseUpdatesItems();
    this.getCommentsAndMentionedItems();
    this.getAnnotationsItems();
  }

  /**
   * @function getCourseUpdatesItems
   * Return the courseUpdateItems observable value
   *
   */
  getCourseUpdatesItems() {
    const courseUpdates = this.allNotificationItems.value.filter(
      (item) => item.type == 'courseupdates'
    );
    this.courseUpdateItems.next(courseUpdates);
    return this.courseUpdateItems.value;
  }

  /**
   * @function getCommentsAndMentionedItems
   * Return the commentsMentionedItems observable value
   *
   */
  getCommentsAndMentionedItems() {
    const commentsUpdates = this.allNotificationItems.value.filter(
      (item) => item.type == 'mentionedandreplied'
    );
    this.commentsMentionedItems.next(commentsUpdates);
    return this.commentsMentionedItems.value;
  }

  /**
   * @function getAnnotationsItems
   * Return the annotationsItems observable value
   *
   */
  getAnnotationsItems() {
    const annotationUpdates = this.allNotificationItems.value.filter(
      (item) => item.type == 'annotations'
    );
    this.annotationsItems.next(annotationUpdates);
    return this.annotationsItems.value;
  }

  /**
   * @function removeItem
   * Remove a notification
   *
   * @param {id} string the id of notification
   *
   */
  removeItem(id: string) {
    return this.http.delete(
      environment.API_URL + '/notifications/' + id,
      HTTPOptions
    );
  }

  /**
   * @function markItemAsRead
   * Mark a notification as read
   *
   * @param {id} string the id of notification
   *
   */
  markItemAsRead(id: string) {
    return this.http.put(
      environment.API_URL + '/notifications/' + id,
      HTTPOptions
    );
  }

  /**
   * @function markItemAsStar
   * Mark a notification as star
   *
   * @param {id} string the id of notification
   *
   */
  markItemAsStar(id: string) {
    return this.http.put(
      environment.API_URL + '/notifications/' + id + '/star',
      HTTPOptions
    );
  }

  /**
   * @function markAllAsRead
   * Mark all the notifications as read
   *
   */
  markAllAsRead() {
    return this.http.patch(
      environment.API_URL + '/notifications/readAll',
      HTTPOptions
    );
  }

  /**
   * @function removeAll
   * Remove all the notifications
   *
   */
  removeAll() {
    return this.http.put(
      environment.API_URL + '/notifications/deleteAll',
      HTTPOptions
    );
  }

  /**
   * @function removeByCourseUpdates
   * Remove all the 'courseupdates' notifications
   *
   */
  removeByCourseUpdates() {
    return this.http.put(
      environment.API_URL + '/notifications/courseupdates',
      HTTPOptions
    );
  }

  /**
   * @function removeByReplies
   * Remove all the 'mentionedandreplied' notifications
   *
   */
  removeByReplies() {
    return this.http.put(
      environment.API_URL + '/notifications/replies',
      HTTPOptions
    );
  }

  /**
   * @function removeByAnnotations
   * Remove all the 'annotations' notifications
   *
   */
  removeByAnnotations() {
    return this.http.put(
      environment.API_URL + '/notifications/annotations',
      HTTPOptions
    );
  }

  /**
   * @function toggleActiveCourse
   * Turn on/off notifications of 'courseupdates'
   *
   */
  toggleActiveCourse() {
    return this.http.put(
      environment.API_URL + '/notifications/deactivate/course',
      HTTPOptions
    );
  }

  /**
   * @function toggleAnnotation
   * Turn on/off notifications of 'annotations'
   *
   */
  toggleAnnotation() {
    return this.http.put(
      environment.API_URL + '/notifications/deactivate/annotation',
      HTTPOptions
    );
  }

  /**
   * @function toggleReply
   * Turn on/off notifications of 'mentionedandreplied'
   *
   */
  toggleReply() {
    return this.http.put(
      environment.API_URL + '/notifications/deactivate/reply',
      HTTPOptions
    );
  }

  /**
   * @function turnOffNotification
   * Turn off notifications from specific user
   *
   * @param {userId} string the userId in which we want to turn off notifications from
   *
   */
  turnOffNotification(userId: string) {
    return this.http.post(
      environment.API_URL + '/notification/deactivate/' + userId,
      HTTPOptions
    );
  }

  /**
   * @function getUserIsCourseTurnOff
   * Get the value of if the 'courseupdates' notifications are turn off or on
   *
   */
  getUserIsCourseTurnOff() {
    return this.http
      .get(environment.API_URL + '/notification/isCourseTurnOff', HTTPOptions)
      .subscribe((data: any) => {
        this.isCourseTurnOff.next(data);
      });
  }

  /**
   * @function getUserIsRepliesTurnOff
   * Get the value of if the 'mentionedandreplied' notifications are turn off or on
   *
   */
  getUserIsRepliesTurnOff() {
    return this.http
      .get(environment.API_URL + '/notification/isRepliesTurnOff', HTTPOptions)
      .subscribe((data: any) => {
        this.isRepliesTurnOff.next(data);
      });
  }

  /**
   * @function getUserIsAnnotationsTurnOff
   * Get the value of if the 'annotations' notifications are turn off or on
   *
   */
  getUserIsAnnotationsTurnOff() {
    return this.http
      .get(
        environment.API_URL + '/notification/isAnnotationTurnOff',
        HTTPOptions
      )
      .subscribe((data: any) => {
        this.isAnnotationTurnOff.next(data);
      });
  }

  /**
   * @function getLoggedInTime
   * Return the time of last logged in
   *
   */
  getLoggedInTime() {
    return this.loggedInTime.value;
  }

  /**
   * @function getChannelNotification
   * Return the notifications from specific channel
   *
   * @param {channelId} string the id of channel
   *
   */
  getChannelNotification(channelId: string) {
    return this.http.get(
      environment.API_URL +
        '/notifications/' +
        channelId +
        '/channelNotifications',
      HTTPOptions
    );
  }

  /**
   * @function getCourseNotification
   * Return the notifications from specific course
   *
   * @param {courseId} string the id of course
   *
   */
  getCourseNotification(courseId: string) {
    return this.http.get(
      environment.API_URL +
        '/notifications/' +
        courseId +
        '/courseNotifications',
      HTTPOptions
    );
  }
}
