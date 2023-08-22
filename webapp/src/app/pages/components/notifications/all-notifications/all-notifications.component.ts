import { Component } from '@angular/core';
import { BaseNotificationDashboardComponent } from '../base-notification-dashboard/base-notification-dashboard.component';
import { Store } from '@ngrx/store';

import {
  State,
  getAnnotationsNotifications,
  getCommentsAndMentionedNotifications,
  getCourseUpdatesNotifications,
  getNotifications,
} from '../state/notifications.reducer';
import { Router } from '@angular/router';
import { CourseService } from 'src/app/services/course.service';
import { HttpClient } from '@angular/common/http';
import {
  Notification,
  NotificationCategory,
} from 'src/app/models/Notification';
import {
  BehaviorSubject,
  Observable,
  combineLatest,
  filter,
  map,
  take,
  tap,
} from 'rxjs';
import { FormBuilder, FormControl } from '@angular/forms';
import { getSubscribedCourses } from 'src/app/state/app.reducer';
import { MenuItem } from 'primeng/api';
import * as NotificationActions from '../state/notifications.actions';

@Component({
  selector: 'app-all-notifications',
  templateUrl: './all-notifications.component.html',
  styleUrls: ['./all-notifications.component.css'],
})
export class AllNotificationsComponent {
  /*   courses = ['Angular', 'React', 'Vue', 'Node'];
  selectedCourses = ['Angular', 'React'];
  numberOptions = [5, 10, 15, 20];
  selectedNumber = 5;
  value: string = 'Admin notifications';
  categories = [
    {
      label: 'Course Updates',
      value: NotificationCategory.CourseUpdate,
    },
    {
      label: 'Comments and Mentions',
      value: NotificationCategory.CommentsAndMentioned,
    },
    {
      label: 'Annotations',
      value: NotificationCategory.Annotations,
    },
  ];

  selectedCategory = [
    {
      label: 'Course Updates',
      value: NotificationCategory.CourseUpdate,
    },
    {
      label: 'Comments and Mentions',
      value: NotificationCategory.CommentsAndMentioned,
    },
    {
      label: 'Annotations',
      value: NotificationCategory.Annotations,
    },
  ];
 */
  //obsevable streams
  /*   courseUpdatesNotifications$ = this.store.select(
    getCourseUpdatesNotifications
  );
  commentsAndMentionedNotifications$ = this.store.select(
    getCommentsAndMentionedNotifications
  );
  annotationsNotifications$ = this.store.select(getAnnotationsNotifications);
  isCourseUpdatesNotificationsVisible$ = new BehaviorSubject<boolean>(true);
  isCommentsAndMentionedNotificationsVisible$ = new BehaviorSubject<boolean>(
    true
  );
  isAnnotationsNotificationsVisible$ = new BehaviorSubject<boolean>(true); */

  protected tabOptions: MenuItem[];
  protected menuOptions: MenuItem[];
  protected isUnreadChecked = false;
  protected isStarredChecked = false;
  protected activeItem: MenuItem;
  protected checkBoxesGroup = this.fb.group({});
  protected masterCheckBox = new FormControl(false);
  protected unreadSwitchBehaviourSubject = new BehaviorSubject<boolean>(false);
  protected unreadSwitch$ = this.unreadSwitchBehaviourSubject.asObservable();
  protected starredBehaviourSubject = new BehaviorSubject<boolean>(false);
  protected starred$ = this.starredBehaviourSubject.asObservable();

  protected tabBehaviourSubject = new BehaviorSubject<string>(
    NotificationCategory.All
  );
  protected tab$ = this.tabBehaviourSubject.asObservable();
  courseOptions: { name: string; id: string }[];
  selectedCourses: string[];
  private allNotifications$: Observable<Notification[]>;
  private courseFilterUpdatedBehaviorSubject = new BehaviorSubject<string[]>(
    []
  );
  private courseFilterUpdated$ =
    this.courseFilterUpdatedBehaviorSubject.asObservable();

  private notificationsFilteredByCourse$ = new Observable<Notification[]>();
  private numAllUnreadNotifications$;
  private numUnreadCourseUpdatesNotifications$;
  private numUnreadCommentsAndMentionsNotifications$;
  private numUnreadAnnotationsNotifications$;
  private notificationsFilteredByCourseAndTab$: Observable<Notification[]>;
  private notificationsFilteredByCourseAndTabAndUnread$: Observable<
    Notification[]
  >;
  public notifications$: Observable<Notification[]>;
  public loading$: Observable<boolean>;
  notificationsFilteredByCourseAndTabAndUnreadAndStarred$: Observable<
    Notification[]
  >;
  constructor(
    protected store: Store<State>,
    protected router: Router,
    protected courseService: CourseService,
    protected fb: FormBuilder,
    private httpClient: HttpClient
  ) {
    /* super(store, router, courseService, fb); // Invoke the superclass constructor */
  }

  ngOnInit(): void {
    /*     this.httpClient.get('assets/data.json').subscribe((data) => {
      console.log(data);
    }); */
    /*  super.ngOnInit(); */
    this.tabOptions = [
      { label: 'All', badge: '0' },
      { label: 'Course Updates', badge: '0' },
      { label: 'Comments & Mentions', badge: '0' },
      { label: 'Annotations', badge: '0' },
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
        command: () => {
          console.log('Settings clicked');
        },
      },
    ];
    this.store.select(getSubscribedCourses).subscribe((courses) => {
      this.courseOptions = courses;
      //by default all courses are selected
      this.selectedCourses = courses.map((course) => course.id);
      this.courseFilterUpdatedBehaviorSubject.next(this.selectedCourses);
    });
    this.allNotifications$ = this.store.select(getNotifications);
    this.notificationsFilteredByCourse$ = combineLatest([
      this.allNotifications$,
      this.courseFilterUpdated$,
    ]).pipe(
      map(([notifications, selectedCourses]) => {
        if (selectedCourses.length === 0) {
          return notifications;
        } else if (selectedCourses.length === 1) {
          notifications;
        }
        return notifications.filter((notification) =>
          selectedCourses.includes(notification?.course_id)
        );
      })
    );

    this.notificationsFilteredByCourseAndTab$ = combineLatest([
      this.notificationsFilteredByCourse$,
      this.tab$,
    ]).pipe(
      map(([notifications, tab]) => {
        if (tab === NotificationCategory.All) {
          return notifications;
        }
        return notifications.filter(
          (notification) => notification.category === tab
        );
      })
    );

    this.notificationsFilteredByCourseAndTabAndUnread$ = combineLatest([
      this.notificationsFilteredByCourseAndTab$,
      this.unreadSwitch$,
    ]).pipe(
      map(([notifications, unreadSwitch]) => {
        if (unreadSwitch) {
          return notifications.filter((notification) => !notification.isRead);
        }
        return notifications;
      })
    );

    this.notificationsFilteredByCourseAndTabAndUnreadAndStarred$ =
      combineLatest([
        this.notificationsFilteredByCourseAndTabAndUnread$,
        this.starred$,
      ]).pipe(
        map(([notifications, starred]) => {
          if (starred) {
            return notifications.filter((notification) => notification.isStar);
          }
          return notifications;
        })
      );

    this.notifications$ =
      this.notificationsFilteredByCourseAndTabAndUnreadAndStarred$;
    this.loading$ = this.notifications$.pipe(
      map((notifications) => (notifications === null ? true : false))
    );

    this.notifications$.subscribe((notifications) => {
      if (notifications) {
        notifications.forEach((notification) => {
          if (!this.checkBoxesGroup.contains(notification._id)) {
            const control = new FormControl(false);
            control.valueChanges.subscribe((val) => {
              console.log('Notification with title: ' + notification._id);
              console.log(val?.valueOf());
            });
            this.checkBoxesGroup.addControl(notification._id, control);
          }
        });
        console.log('forEach is over');
      }
    });

    this.masterCheckBox.valueChanges.subscribe((val) => {
      console.log('susbscriber running! master changed');
      console.log(val);
      const controls = this.checkBoxesGroup.controls;
      console.log(controls);
      Object.keys(controls).forEach((controlName) => {
        console.log(controlName);
        const control = controls[controlName];
        control.setValue(val, { emitEvent: false });
      });
    });

    this.numAllUnreadNotifications$ = this.notificationsFilteredByCourse$.pipe(
      map(
        (notifications) =>
          notifications.filter((notification) => !notification.isRead).length
      )
    );

    this.numUnreadCourseUpdatesNotifications$ =
      this.notificationsFilteredByCourse$.pipe(
        map(
          (notifications) =>
            notifications.filter(
              (notification) =>
                notification.category === NotificationCategory.CourseUpdate &&
                !notification.isRead
            ).length
        )
      );

    this.numUnreadCommentsAndMentionsNotifications$ =
      this.notificationsFilteredByCourse$.pipe(
        map(
          (notifications) =>
            notifications.filter(
              (notification) =>
                notification.category ===
                  NotificationCategory.CommentsAndMentioned &&
                !notification.isRead
            ).length
        )
      );

    this.numUnreadAnnotationsNotifications$ =
      this.notificationsFilteredByCourse$.pipe(
        map(
          (notifications) =>
            notifications.filter(
              (notification) =>
                notification.category === NotificationCategory.Annotations &&
                !notification.isRead
            ).length
        )
      );

    this.numAllUnreadNotifications$.subscribe((num) => {
      let tempTabOptions = [...this.tabOptions];
      tempTabOptions[0].badge = num.toString();
      this.tabOptions = [...tempTabOptions];
    });

    this.numUnreadCourseUpdatesNotifications$.subscribe((num) => {
      let tempTabOptions = [...this.tabOptions];
      tempTabOptions[1].badge = num.toString();
      this.tabOptions = [...tempTabOptions];
    });

    this.numUnreadCommentsAndMentionsNotifications$.subscribe((num) => {
      let tempTabOptions = [...this.tabOptions];
      tempTabOptions[2].badge = num.toString();
      this.tabOptions = [...tempTabOptions];
    });

    this.numUnreadAnnotationsNotifications$.subscribe((num) => {
      let tempTabOptions = [...this.tabOptions];
      tempTabOptions[3].badge = num.toString();
      this.tabOptions = [...tempTabOptions];
    });

    //everytime the tab is opened, we want to show the all notifications tab
    this.onTabSwitched(this.tabOptions[0]);
  }

  onCourseFilterChanged($event) {
    console.log('filter updated');
    console.log($event.value);
    this.courseFilterUpdatedBehaviorSubject.next($event.value);
  }

  protected unreadSwitchToggled($event) {
    console.log('unread switch toggled');
    console.log($event);
    //$event contains either the value true or false
    this.isUnreadChecked = $event;
    this.unreadSwitchBehaviourSubject.next($event);
  }

  protected starredSwitchToggled($event) {
    console.log('starred switch toggled');
    console.log($event);
    this.isStarredChecked = $event;
    this.starredBehaviourSubject.next($event);
  }

  protected onTabSwitched(selectedItem: MenuItem) {
    console.log('tab switch');
    this.removeAllCheckBoxControls();
    this.activeItem = selectedItem;
    console.log(selectedItem);
    if (selectedItem.label === 'All') {
      this.tabBehaviourSubject.next(NotificationCategory.All);
    } else if (selectedItem.label === 'Course Updates') {
      this.tabBehaviourSubject.next(NotificationCategory.CourseUpdate);
    } else if (selectedItem.label === 'Comments & Mentions') {
      this.tabBehaviourSubject.next(NotificationCategory.CommentsAndMentioned);
    } else if (selectedItem.label === 'Annotations') {
      this.tabBehaviourSubject.next(NotificationCategory.Annotations);
    }
  }

  removeAllCheckBoxControls() {
    //this method removes all the controls that are present in the formgroup
    this.checkBoxesGroup.reset();
    this.masterCheckBox.reset();
  }

  protected removeSelected($event) {
    $event.originalEvent.stopPropagation();
    console.log('removing selected notifications');
    console.log(this.checkBoxesGroup.value);
    let selectedNotifications = [];
    Object.keys(this.checkBoxesGroup.value).forEach((key) => {
      if (this.checkBoxesGroup.value[key]) {
        selectedNotifications.push(key);
      }
    });
    console.log(selectedNotifications);

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
        console.log(notifications);
        notificationsToRemove = notifications;
        this.store.dispatch(
          NotificationActions.notificationsRemoved({
            notifications: notificationsToRemove,
          })
        );
      });
  }

  protected markSelectedAsUnread($event) {
    $event.originalEvent.stopPropagation();
    console.log('marking selected as unread');
    console.log(this.checkBoxesGroup.value);
    let selectedNotifications = [];
    Object.keys(this.checkBoxesGroup.value).forEach((key) => {
      if (this.checkBoxesGroup.value[key]) {
        selectedNotifications.push(key);
      }
    });

    console.log(selectedNotifications);
    this.store.dispatch(
      NotificationActions.notificationsMarkedAsUnread({
        notifications: selectedNotifications,
      })
    );
  }

  protected markSelectedAsRead($event) {
    $event.originalEvent.stopPropagation();
    console.log('marking selected as read');
    console.log(this.checkBoxesGroup.value);
    let selectedNotifications = [];
    Object.keys(this.checkBoxesGroup.value).forEach((key) => {
      if (this.checkBoxesGroup.value[key]) {
        selectedNotifications.push(key);
      }
    });

    console.log(selectedNotifications);
    /* NotificationActions.notificationsMarkedAsRead({
      notifications: selectedNotifications,
    }); */
    this.store.dispatch(
      NotificationActions.notificationsMarkedAsRead({
        notifications: selectedNotifications,
      })
    );
  }

  protected onNotificationClicked(notification: Notification) {
    console.log('Notification clicked!');
    console.log(notification);
    this.store.dispatch(
      NotificationActions.notificationsMarkedAsRead({
        notifications: [notification._id],
      })
    );
    /* this.notificationService.previousURL = this.router.url; */

    if (notification.category === NotificationCategory.CourseUpdate) {
      //need to check if its a material update first
      if (notification.material_id) {
        console.log('its a material update');
        this.courseService.Notification = notification;
        this.courseService.navigatingToMaterial = true;
        /* this.router.navigate(['/course', notification.course_id]); */
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
        this.router.navigate([
          '/course',
          notification.course_id,
          'channel',
          notification.channel_id,
        ]);
      } else {
        this.courseService.Notification = notification;
        this.courseService.navigatingToMaterial = true;
        this.router.navigate(['/course', notification.course_id]);
      }
    }
    if (
      notification.category === NotificationCategory.Annotations ||
      notification.category === NotificationCategory.CommentsAndMentioned
    ) {
      console.log('its an annotation notification');
      this.courseService.Notification = notification;
      this.courseService.navigatingToMaterial = true;
      /* this.router.navigate(['/course', notification.course_id]); */
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
    }
  }

  /*   onFiltersModified($event: any) {
    console.log($event);
    this.categories.forEach((category) => {
      const found = $event.value.find(
        (element: any) => element.value === category.value
      );
      if (found) {
        if (category.value === NotificationCategory.CourseUpdate) {
          this.isCourseUpdatesNotificationsVisible$.next(true);
        }
        if (category.value === NotificationCategory.CommentsAndMentioned) {
          this.isCommentsAndMentionedNotificationsVisible$.next(true);
        }
        if (category.value === NotificationCategory.Annotations) {
          this.isAnnotationsNotificationsVisible$.next(true);
        }
      } else {
        if (category.value === NotificationCategory.CourseUpdate) {
          this.isCourseUpdatesNotificationsVisible$.next(false);
        }
        if (category.value === NotificationCategory.CommentsAndMentioned) {
          this.isCommentsAndMentionedNotificationsVisible$.next(false);
        }
        if (category.value === NotificationCategory.Annotations) {
          this.isAnnotationsNotificationsVisible$.next(false);
        }
      }
    });
  } */
}
