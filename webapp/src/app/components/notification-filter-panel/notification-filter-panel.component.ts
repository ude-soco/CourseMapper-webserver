import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  NotificationType,
  Notification,
  NotificationTypeFilter,
  NotificationNumberFilter,
  NotificationCourseFilter,
} from 'src/app/model/notification-item';
import { CourseService } from 'src/app/services/course.service';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-notification-filter-panel',
  templateUrl: './notification-filter-panel.component.html',
  styleUrls: ['./notification-filter-panel.component.css'],
})
export class NotificationFilterPanelComponent implements OnInit {
  notificationTypeFilter: NotificationTypeFilter[] = [];
  number!: number;
  selectedType!: NotificationTypeFilter;
  selectedCourse!: NotificationCourseFilter;

  starred!: boolean;
  @Input() notificationItems: Notification[] = [];
  searchValue: string;
  notificationNumberFilter: NotificationNumberFilter[] = [];
  selectedNumber: NotificationNumberFilter;
  placeholder = 'Filter by number';
  notificationCourseFilter: NotificationCourseFilter[] = [];
  constructor(
    private notificationService: NotificationServiceService,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.notificationService.filteredType.next({ name: '', type: undefined });
    this.notificationService.showNumber.next({
      label: 'all',
      value: undefined,
    });
    this.notificationService.searchString.next('');
    this.searchValue = '';
    this.starred = true;
    this.notificationService.isStarClicked$.subscribe((isStar) => {
      this.starred = !isStar;
    });
    this.notificationTypeFilter = [
      { name: 'Course updates', type: NotificationType.CourseUpdate },
      {
        name: 'Replies & mentions',
        type: NotificationType.CommentsAndMentioned,
      },
      { name: 'Annotations', type: NotificationType.Annotations },
    ];
    this.notificationNumberFilter = [
      { label: 'all', value: undefined },
      { label: '5', value: 5 },
      { label: '10', value: 10 },
      {
        label: '15',
        value: 15,
      },
      {
        label: '20',
        value: 20,
      },
    ];
    this.notificationService.filteredType$.subscribe((filterType) => {
      this.selectedType = { name: filterType.name, type: filterType.type };
    });

    this.notificationService.filteredCourse$.subscribe((filterCourse) => {
      this.selectedCourse = { name: filterCourse.name, id: filterCourse.id };
    });

    this.courseService.getSubscribedCourseLists().subscribe((res: any) => {
      let temp = [];
      temp = [...res.courseDetail];
      this.notificationCourseFilter = temp.map((course) => {
        return {
          id: course._id,
          name: course.name,
        };
      });
    });
  }

  viewStar() {
    this.starred = !this.starred;

    this.notificationService.isStarClicked.next(!this.starred);
  }

  selectType(event: any) {
    this.notificationService.filteredType.next({
      name: event.value.name,
      type: event.value.type,
    });
  }
  selectCourse(event: any) {
    this.notificationService.filteredCourse.next({
      name: event.value.name,
      id: event.value.id,
    });
    this.notificationService.searchString.next(event.value.name);
  }

  resetFilter() {
    this.notificationService.filteredType.next({ name: '', type: undefined });
    this.notificationService.filteredCourse.next({
      name: '',
      id: undefined,
    });

    this.notificationService.showNumber.next({
      label: 'all',
      value: undefined,
    });
    this.selectedNumber = undefined;
    this.notificationService.searchString.next('');
    this.searchValue = '';
    this.notificationService.isStarClicked.next(false);
  }

  filterByNumber(e: any) {
    this.notificationService.showNumber.next({
      label: e.value.label,
      value: e.value.value,
    });
  }

  onChange(e: any) {
    this.notificationService.searchString.next(e);
  }
}
