import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { FormArray, FormControl } from '@angular/forms';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  filter,
  map,
  take,
  tap,
} from 'rxjs';
import { Router } from '@angular/router';
import * as courseActions from 'src/app/pages/courses/state/course.actions';
import {
  Notification,
  UserNotification,
  NotificationCategory,
} from 'src/app/models/Notification';
import { FormBuilder } from '@angular/forms';
import {
  State,
  getAllNotificationsNumUnread,
  getFilteredNotifications,
  getCourseUpdatesNumUnread,
  getCommentsAndMentionedNumUnread,
  getAnnotationsNumUnread,
} from '../state/notifications.reducer';
import { Store } from '@ngrx/store';
import * as NotificationActions from '../state/notifications.actions';
import { NotificationsService } from 'src/app/services/notifications.service';
import { CourseService } from 'src/app/services/course.service';
import { getLastTimeCourseMapperOpened } from 'src/app/state/app.reducer';
import * as $ from 'jquery';
import * as AppActions from 'src/app/state/app.actions';
@Component({
  selector: 'app-base-notification-dashboard',
  template: '',
  styleUrls: ['./base-notification-dashboard.component.css'],
})
export class BaseNotificationDashboardComponent {
  protected tabOptions: MenuItem[];
  protected menuOptions: MenuItem[];
  private tabSwitchBehaviour: BehaviorSubject<{ category: string }> =
    new BehaviorSubject({
      category: 'All',
    });

  protected notifications: Notification[];
  protected notifications$: Observable<Notification[]>;
  protected tabSwitch$: Observable<{ category: string }> =
    this.tabSwitchBehaviour.asObservable();
  protected allNotificationsNumUnread$: Observable<number> = this.store.select(
    getAllNotificationsNumUnread
  );
  protected courseUpdatesNumUnread$: Observable<number> = this.store.select(
    getCourseUpdatesNumUnread
  );
  protected commentsAndMentionedNumUnread$: Observable<number> =
    this.store.select(getCommentsAndMentionedNumUnread);
  protected annotationsNumUnread$: Observable<number> = this.store.select(
    getAnnotationsNumUnread
  );
  protected loading$: Observable<boolean>;
  protected isUnreadChecked = false;
  protected activeItem: MenuItem;
  protected checkBoxesGroup = this.fb.group({});
  protected masterCheckBox = new FormControl(false);
  protected unreadSwitchBehaviourSubject = new BehaviorSubject<boolean>(false);
  protected unreadSwitch$ = this.unreadSwitchBehaviourSubject.asObservable();
  protected filteredNotifications$: Observable<Notification[]>;
  protected showBulkOperations = false;
  protected lastTimeCourseMapperOpened$: Observable<string>;
  protected earlierNotifications$: Observable<Notification[]>;
  protected newerNotifications$: Observable<Notification[]>;

  constructor(
    protected store: Store<State>,
    protected router: Router,
    protected courseService: CourseService,
    protected fb: FormBuilder
  ) {}

  protected ngOnInit(): void {
    //initialising the items for the menu
    this.tabOptions = [
      { label: 'All' },
      { label: 'Course Updates' },
      { label: 'Replies & Mentions' },
      { label: 'Annotations' },
    ];

    this.activeItem = this.tabOptions[0];

    this.menuOptions = [
      {
        label: 'Mark selected as read',
        icon: 'pi pi-check',
        command: ($event) => {
          this.markSelectedAsRead($event);
        },
      },
      {
        label: 'Mark selected as unread',
        icon: 'pi pi-envelope',
        command: ($event) => {
          this.markSelectedAsUnread($event);
        },
      },
      {
        label: 'Remove selected notifications',
        icon: 'pi pi-times',
        command: ($event) => {
          this.removeSelected($event);
        },
      },
      {
        label: 'Settings',
        icon: 'pi pi-cog',
        command: () => {},
      },
    ];

    this.lastTimeCourseMapperOpened$ = this.store.select(
      getLastTimeCourseMapperOpened
    );
    /* this.notifications$ = this.store.select(getFilteredNotifications); */
    this.filteredNotifications$ = this.store.select(getFilteredNotifications);
    this.allNotificationsNumUnread$.subscribe((num) => {
      if (num >= 0) {
        let tempTabOptions = [...this.tabOptions];
        tempTabOptions[0].badge = num.toString();
        this.tabOptions = [...tempTabOptions];
      }
    });
    this.courseUpdatesNumUnread$.subscribe((num) => {
      if (num >= 0) {
        let tempTabOptions = [...this.tabOptions];
        tempTabOptions[1].badge = num.toString();
        this.tabOptions = [...tempTabOptions];
      }
    });
    this.commentsAndMentionedNumUnread$.subscribe((num) => {
      if (num >= 0) {
        let tempTabOptions = [...this.tabOptions];
        tempTabOptions[2].badge = num.toString();
        this.tabOptions = [...tempTabOptions];
      }
    });
    this.annotationsNumUnread$.subscribe((num) => {
      if (num >= 0) {
        let tempTabOptions = [...this.tabOptions];
        tempTabOptions[3].badge = num.toString();
        this.tabOptions = [...tempTabOptions];
      }
    });

    this.notifications$ = combineLatest([
      this.filteredNotifications$,
      this.unreadSwitch$,
      this.lastTimeCourseMapperOpened$,
    ]).pipe(
      tap((notifications) => {}),
      map(([notifications, unreadSwitch]) => {
        if (notifications) {
          if (unreadSwitch) {
            return notifications.filter((notification) => {
              return notification.isRead === false;
            });
          } else {
            return notifications;
          }
        } else {
          return [];
        }
      }),
      tap((notifications) => {})
    );

    this.earlierNotifications$ = combineLatest([
      this.notifications$,
      this.lastTimeCourseMapperOpened$,
    ]).pipe(
      map(([notifications, lastTimeCourseMapperOpened]) => {
        const lastTimeCourseMapperOpenedConverted = new Date(
          lastTimeCourseMapperOpened
        );
        return notifications.filter((notification) => {
          const notificationDate = new Date(notification.timestamp);
          if (notificationDate < lastTimeCourseMapperOpenedConverted) {
            return true;
          }
          return false;
        });
      })
    );

    this.newerNotifications$ = combineLatest([
      this.notifications$,
      this.lastTimeCourseMapperOpened$,
    ]).pipe(
      map(([notifications, lastTimeCourseMapperOpened]) => {
        const lastTimeCourseMapperOpenedConverted = new Date(
          lastTimeCourseMapperOpened
        );
        return notifications.filter((notification) => {
          const notificationDate = new Date(notification.timestamp);
          if (notificationDate >= lastTimeCourseMapperOpenedConverted) {
            return true;
          }
          return false;
        });
      })
    );

    this.loading$ = this.notifications$.pipe(
      map((notifications) => (notifications === null ? true : false))
    );

    //for all the notifications that are returned, we create a formcontrol for each one
    this.notifications$.subscribe((notifications) => {
      if (notifications) {
        notifications.forEach((notification) => {
          if (!this.checkBoxesGroup.contains(notification._id)) {
            const control = new FormControl(false);
            this.checkBoxesGroup.addControl(notification._id, control);
          }
        });
      }
    });

    //making a new form control for the masterCheckbox
    this.masterCheckBox.valueChanges.subscribe((val) => {
      this.showBulkOperations = val;
      const controls = this.checkBoxesGroup.controls;

      Object.keys(controls).forEach((controlName) => {
        const control = controls[controlName];
        control.setValue(val, { emitEvent: false });
      });
    });

    this.checkBoxesGroup.valueChanges.subscribe((val) => {
      const controls = this.checkBoxesGroup.controls;

      //check if anyone of control has value true, if yes, the set the variable showBulkOperations to true, else set it to false
      let showBulkOperations = false;
      Object.keys(controls).forEach((controlName) => {
        const control = controls[controlName];
        if (control.value) {
          showBulkOperations = true;
        }
      });
      this.showBulkOperations = showBulkOperations;
    });

    //everytime the tab is opened, we want to show the all notifications tab
    this.onTabSwitched(this.tabOptions[0]);
  }

  protected onTabSwitched(selectedItem: MenuItem) {
    this.removeAllCheckBoxControls();
    this.activeItem = selectedItem;

    if (selectedItem.label === 'All') {
      this.store.dispatch(
        NotificationActions.tabSwitched({ tab: NotificationCategory.All })
      );
    } else if (selectedItem.label === 'Course Updates') {
      this.store.dispatch(
        NotificationActions.tabSwitched({
          tab: NotificationCategory.CourseUpdate,
        })
      );
    } else if (selectedItem.label === 'Replies & Mentions') {
      this.store.dispatch(
        NotificationActions.tabSwitched({
          tab: NotificationCategory.CommentsAndMentioned,
        })
      );
    } else if (selectedItem.label === 'Annotations') {
      this.store.dispatch(
        NotificationActions.tabSwitched({
          tab: NotificationCategory.Annotations,
        })
      );
    }
  }
  removeAllCheckBoxControls() {
    //this method removes all the controls that are present in the formgroup
    this.checkBoxesGroup.reset();
    this.masterCheckBox.reset();
  }

  onSeeAllClicked($event) {
    this.store.dispatch(
      AppActions.setShowNotificationsPanel({ showNotificationsPanel: false })
    );
    this.router.navigate(['/notification/all']);
  }

  protected onNotificationClicked(notification: Notification) {
    this.store.dispatch(
      NotificationActions.notificationsMarkedAsRead({
        notifications: [notification._id],
      })
    );
    /* this.notificationService.previousURL = this.router.url; */

    if (notification.category === NotificationCategory.CourseUpdate) {
      //need to check if its a material update first
      if (notification.material_id) {
        this.courseService.Notification = notification;
        this.courseService.navigatingToMaterial = true;
        this.store.dispatch(
          AppActions.setShowNotificationsPanel({
            showNotificationsPanel: false,
          })
        );
        //if the notification is for a deleted Material, navigate to the channel
        if (notification.isDeletingMaterial) {
          this.router.navigateByUrl(
            '/course/' +
              notification.course_id +
              '/channel/' +
              notification.channel_id
          );
          return;
        }
        this.router.navigateByUrl(
          '/course/' +
            notification.course_id +
            '/channel/' +
            notification.channel_id +
            '/material/' +
            '(material:' +
            notification.material_id +
            `/${notification.materialType})`
        );
      } else if (notification.channel_id) {
        //check if its a channel update
        this.courseService.Notification = notification;
        this.courseService.navigatingToMaterial = true;
        this.store.dispatch(
          AppActions.setShowNotificationsPanel({
            showNotificationsPanel: false,
          })
        );

        if (notification.isDeletingChannel) {
          this.router.navigateByUrl(
            '/course/' + notification.course_id + '/welcome'
          );
          return;
        }

        this.router.navigate([
          '/course',
          notification.course_id,
          'channel',
          notification.channel_id,
        ]);
      } else {
        //WIll run below code if its a topic update notification
        this.courseService.Notification = notification;
        this.courseService.navigatingToMaterial = true;
        this.store.dispatch(
          AppActions.setShowNotificationsPanel({
            showNotificationsPanel: false,
          })
        );

        this.router.navigate(['/course', notification.course_id]);
      }
    }
    if (
      notification.category === NotificationCategory.Annotations ||
      notification.category === NotificationCategory.CommentsAndMentioned
    ) {
      this.courseService.Notification = notification;

      this.store.dispatch(
        courseActions.setCourseId({ courseId: notification.course_id })
      );

      if (notification.reply_id) {
        this.courseService.navigatingToMaterial = true;
        this.store.dispatch(
          AppActions.setShowNotificationsPanel({
            showNotificationsPanel: false,
          })
        );
        if (notification.isDeletingReply) {
          this.router.navigateByUrl(
            '/course/' +
              notification.course_id +
              '/channel/' +
              notification.channel_id +
              '/material/' +
              '(material:' +
              notification.material_id +
              `/${notification.materialType})` +
              `#annotation-${notification.annotation_id}`
          );
          return;
        }

        this.router.navigateByUrl(
          '/course/' +
            notification.course_id +
            '/channel/' +
            notification.channel_id +
            '/material/' +
            '(material:' +
            notification.material_id +
            `/${notification.materialType})` +
            `#reply-${notification.reply_id}`
        );
        return;
      }
      if (notification.annotation_id) {
        if (notification.isDeletingAnnotation) {
          this.router.navigateByUrl(
            '/course/' +
              notification.course_id +
              '/channel/' +
              notification.channel_id +
              '/material/' +
              '(material:' +
              notification.material_id +
              `/${notification.materialType})`
          );
          return;
        }

        //if website is already on the same material, then just scroll to the annotation

        if (
          this.router.url.includes(
            '/course/' +
              notification.course_id +
              '/channel/' +
              notification.channel_id +
              '/material/' +
              '(material:' +
              notification.material_id +
              `/${notification.materialType})`
          )
        ) {
          this.store.dispatch(
            AppActions.setShowNotificationsPanel({
              showNotificationsPanel: false,
            })
          );

          this.courseService.navigatingToMaterial = false;
          const url = window.location.href;

          const elementToScrollTo = document.getElementById(
            `annotation-${notification.annotation_id}`
          );
          elementToScrollTo.scrollIntoView();
          // Scroll to the element
          window.location.hash = '#annotation-' + notification.annotation_id;
          setTimeout(function () {
            $(window.location.hash).css(
              'box-shadow',
              '0 0 25px rgba(83, 83, 255, 1)'
            );
            setTimeout(function () {
              $(window.location.hash).css('box-shadow', 'none');
            }, 5000);
          }, 100);
          return;
        }

        //if we are not on the material where annotation is present, then we will need to navigate to it.
        this.courseService.navigatingToMaterial = true;
        this.store.dispatch(
          AppActions.setShowNotificationsPanel({
            showNotificationsPanel: false,
          })
        );

        this.router.navigateByUrl(
          '/course/' +
            notification.course_id +
            '/channel/' +
            notification.channel_id +
            '/material/' +
            '(material:' +
            notification.material_id +
            `/${notification.materialType})` +
            `#annotation-${notification.annotation_id}`
        );
      }
    }
  }

  protected onNotificationDashboardClosed() {}

  protected markSelectedAsRead($event) {
    $event.stopPropagation();

    let selectedNotifications = [];
    Object.keys(this.checkBoxesGroup.value).forEach((key) => {
      if (this.checkBoxesGroup.value[key]) {
        selectedNotifications.push(key);
      }
    });

    /* NotificationActions.notificationsMarkedAsRead({
      notifications: selectedNotifications,
    }); */
    this.store.dispatch(
      NotificationActions.notificationsMarkedAsRead({
        notifications: selectedNotifications,
      })
    );
  }

  protected markSelectedAsUnread($event) {
    $event.stopPropagation();

    let selectedNotifications = [];
    Object.keys(this.checkBoxesGroup.value).forEach((key) => {
      if (this.checkBoxesGroup.value[key]) {
        selectedNotifications.push(key);
      }
    });

    this.store.dispatch(
      NotificationActions.notificationsMarkedAsUnread({
        notifications: selectedNotifications,
      })
    );
  }

  protected removeSelected($event) {
    $event.stopPropagation();

    let selectedNotifications = [];
    Object.keys(this.checkBoxesGroup.value).forEach((key) => {
      if (this.checkBoxesGroup.value[key]) {
        selectedNotifications.push(key);
      }
    });

    //subscribe to the notifications observable and get the notifications whose id's are present in the selectedNotifications array and then dispatch the action and then unsuscribe from the observable
    let notificationsToRemove: Notification[];
    this.notifications$
      .pipe(
        take(1),
        map((notifications) =>
          notifications.filter((notification) =>
            selectedNotifications.includes(notification._id)
          )
        )
      )
      .subscribe((notifications) => {
        notificationsToRemove = notifications;
        this.store.dispatch(
          NotificationActions.notificationsRemoved({
            notifications: notificationsToRemove,
          })
        );
      });
  }

  protected unreadSwitchToggled($event) {
    this.isUnreadChecked = $event;
    this.unreadSwitchBehaviourSubject.next($event);
  }
}
