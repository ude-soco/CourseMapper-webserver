import { Component, Input, OnInit } from '@angular/core';
import {
  NotificationItem,
  NotificationType,
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
  @Input() notificationItems: NotificationItem[] = [];

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
  }

  ngOnInit(): void {}

  viewStar() {
    this.starred = !this.starred;
    console.log(
      'filter star',
      this.starred,
      this.notificationItems.filter((item) => item.isStar == true)
    );
    this.notificationService.isStarClicked.next(!this.starred);
  }

  selectType(event: any) {
    console.log('select type', event.value.type);
    this.notificationService.filteredType.next(event.value.type);
  }

  resetFilter() {
    console.log('reset filter');
    this.notificationService.filteredType.next('');
  }

  filterByNumber(e: any) {
    console.log('filterby number', e);
  }
  onBlur(e: any) {
    console.log('blur', e.target.value);
  }
}
