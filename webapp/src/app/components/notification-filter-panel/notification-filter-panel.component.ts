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
  placeholder = 'Order by number';
  constructor(private notificationService: NotificationServiceService) {}

  ngOnInit(): void {
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
        value: 3,
      },
      {
        value: 5,
      },
      {
        value: 10,
      },
      {
        value: 15,
      },
    ];
    this.notificationService.filteredType$.subscribe((filterType) => {
      this.selectedType = { name: filterType.name, type: filterType.type };
    });
    this.notificationService.showNumber$.subscribe((number) => {
      console.log(this.selectedNumber, number);
      if (number.value == undefined) {
        this.placeholder = 'Order by number';
        console.log('it is undefined');
      } else {
        this.selectedNumber.value = number.value;
      }
    });
    console.log('number', this.selectedNumber);
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

  resetFilter() {
    this.notificationService.filteredType.next({ name: '', type: undefined });
    this.notificationService.showNumber.next({ value: undefined });
  }

  filterByNumber(e: any) {
    this.notificationService.showNumber.next({ value: e.value.value });
  }
  onBlur(e: any) {}
  onChange(e: any) {
    this.notificationService.searchString.next(e);
  }
}
