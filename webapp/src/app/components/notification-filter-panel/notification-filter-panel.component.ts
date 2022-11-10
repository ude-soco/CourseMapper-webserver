import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import {
  NotificationType,
  Notification,
  NotificationTypeFilter,
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
  constructor(private notificationService: NotificationServiceService) {
    console.log('searchvalue', this.searchValue);
    this.starred = true;
    this.notificationTypeFilter = [
      { name: 'Course updates', type: NotificationType.CourseUpdate },
      {
        name: 'Comments & mentioned',
        type: NotificationType.CommentsAndMentioned,
      },
      { name: 'Annotations', type: NotificationType.Annotations },
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
  }

  filterByNumber(e: any) {
    this.notificationService.showNumber.next(e.value);
  }
  onBlur(e: any) {}
  onChange(e: any) {
    this.notificationService.searchString.next(e);
  }
}
