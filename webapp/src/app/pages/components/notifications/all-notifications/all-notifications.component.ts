import { Component, ElementRef, Renderer2 } from '@angular/core';
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
  protected _searchValue: string = '';
  private _selectedDateSortingOption = 'Newest first';
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
  protected searchInputBehaviorSubject = new BehaviorSubject<string>(
    this._searchValue
  );
  protected searchInput$ = this.searchInputBehaviorSubject.asObservable();
  protected dateSortingBehaviourSubject = new BehaviorSubject<string>(
    this._selectedDateSortingOption
  );
  protected dateSorting$ = this.dateSortingBehaviourSubject.asObservable();

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
  notificationsFilteredByCourseAndSearchTerm$: Observable<Notification[]>;
  protected dateSortingOptions = ['Newest first', 'Oldest first'];
  notificationsFilteredByCourseAndTabAndUnreadAndStarredAndDateSorting$: Observable<
    Notification[]
  >;
  protected showBulkOperations = false;

  constructor(
    protected store: Store<State>,
    protected router: Router,
    protected courseService: CourseService,
    protected fb: FormBuilder,
    private httpClient: HttpClient,
    private el: ElementRef,
    private renderer: Renderer2
  ) {
    /* super(store, router, courseService, fb); // Invoke the superclass constructor */
  }

  ngOnInit(): void {
    /*     this.httpClient.get('assets/data.json').subscribe((data) => {

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
        label: 'Settings',
        icon: 'pi pi-cog',
        command: () => {},
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

    this.notificationsFilteredByCourseAndSearchTerm$ = combineLatest([
      this.notificationsFilteredByCourse$,
      this.searchInput$,
    ]).pipe(
      map(([notifications, searchTerm]) => {
        if (searchTerm === '') {
          return notifications;
        }
        return notifications.filter((notification) =>
          notification.extraMessage
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
        );
      })
    );

    this.notificationsFilteredByCourseAndTab$ = combineLatest([
      this.notificationsFilteredByCourseAndSearchTerm$,
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

    this.notificationsFilteredByCourseAndTabAndUnreadAndStarredAndDateSorting$ =
      combineLatest([
        this.notificationsFilteredByCourseAndTabAndUnreadAndStarred$,
        this.dateSorting$,
      ]).pipe(
        map(([notifications, dateSorting]) => {
          // Create a new array to hold the sorted notifications
          const sortedNotifications = [...notifications]; // Use the spread operator to clone the array

          if (dateSorting === 'Oldest first') {
            sortedNotifications.sort((a, b) => {
              return (
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
              );
            });
          } else {
            sortedNotifications.sort((a, b) => {
              return (
                new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime()
              );
            });
          }

          return sortedNotifications; // Return the new sorted array
        })
      );

    this.notifications$ =
      this.notificationsFilteredByCourseAndTabAndUnreadAndStarredAndDateSorting$;
    this.loading$ = this.notifications$.pipe(
      map((notifications) => (notifications === null ? true : false))
    );

    this.notifications$.subscribe((notifications) => {
      if (notifications) {
        notifications.forEach((notification) => {
          if (!this.checkBoxesGroup.contains(notification._id)) {
            const control = new FormControl(false);
            control.valueChanges.subscribe((val) => {
              console.log(val?.valueOf());
            });
            this.checkBoxesGroup.addControl(notification._id, control);
          }
        });
      }
    });

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
    this.courseFilterUpdatedBehaviorSubject.next($event.value);
  }

  get searchValue() {
    return this._searchValue;
  }

  set searchValue(value: string) {
    this._searchValue = value;

    this.searchInputBehaviorSubject.next(value);
  }

  get selectedDateSortingOption() {
    return this._selectedDateSortingOption;
  }

  set selectedDateSortingOption(value: string) {
    this._selectedDateSortingOption = value;

    this.dateSortingBehaviourSubject.next(value);
  }

  protected unreadSwitchToggled($event) {
    //$event contains either the value true or false
    this.isUnreadChecked = $event;
    this.unreadSwitchBehaviourSubject.next($event);
  }

  protected starredSwitchToggled($event) {
    this.isStarredChecked = $event;
    this.starredBehaviourSubject.next($event);
  }

  protected onTabSwitched(selectedItem: MenuItem) {
    this.removeAllCheckBoxControls();
    this.activeItem = selectedItem;

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

  /*   ngAfterViewChecked() {
    const element = this.el.nativeElement;

    const spans = element.querySelectorAll('.notification-message');
    spans.forEach((span) => {
      this.renderer.addClass(span, 'highlight');
    }); */
  /*   ngAfterViewChecked() {
    const element = this.el.nativeElement;
    const searchValue = this.searchValue.toLowerCase(); // Convert to lowercase for case-insensitive matching

    const spans = element.querySelectorAll('.notification-message');
    spans.forEach((span) => {
      const originalText = span.innerHTML; // Get the original text content of the span
      // Break up the text into words
      const words = originalText.split(' ');

      // Check if the search value is present for any word in the words array, if it is, the part of the word that matches the search value will be highlighted, else the whole word remains unhighlighted.
      const highlightedWords = words.map((word) => {
        if (word.toLowerCase().includes(searchValue)) {
          // Highlight the word while keeping the original casing
          return word.replace(
            new RegExp(searchValue, 'gi'),
            `<span class="highlight">$&</span>`
          );
        } else {
          return word;
        }
      });

      // Now the elements in the highlightedWords array are either highlighted or not highlighted, so we need to join them back to form a string
      const highlightedText = highlightedWords.join(' ');
      span.innerHTML = highlightedText;
    });
  } */
}

/*   onFiltersModified($event: any) {

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
