import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  NotificationType,
  Notification,
  NotificationTypeFilter,
  NotificationNumberFilter,
} from 'src/app/model/notification-item';
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
  starred!: boolean;
  @Input() notificationItems: Notification[] = [];
  searchValue: string;
  notificationNumberFilter: NotificationNumberFilter[] = [];
  selectedNumber: NotificationNumberFilter;
  constructor(private notificationService: NotificationServiceService) {
    this.starred = true;
    this.notificationTypeFilter = [
      { name: 'Course updates', type: NotificationType.CourseUpdate },
      {
        name: 'Comments & mentioned',
        type: NotificationType.CommentsAndMentioned,
      },
      { name: 'Annotations', type: NotificationType.Annotations },
    ];
    this.notificationNumberFilter = [
      {
        label: '3',
        value: 3,
      },
      {
        label: '5',
        value: 5,
      },
      {
        label: '10',
        value: 10,
      },
      {
        label: '15',
        value: 15,
      },
    ];
  }

  ngOnInit(): void {}

  viewStar() {
    this.starred = !this.starred;

    this.notificationService.isStarClicked.next(!this.starred);
  }

  selectType(event: any) {
    this.notificationService.filteredType.next(event.value.type);
  }

  resetFilter() {
    this.notificationService.filteredType.next('');
    this.notificationService.showNumber.next(undefined);
  }

  filterByNumber(e: any) {
    this.notificationService.showNumber.next(e.value.value);
  }
  onBlur(e: any) {}
  onChange(e: any) {
    this.notificationService.searchString.next(e);
  }
}
