import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { Notification, ActiveLocation } from 'src/app/model/notification-item';
import { MenuItem } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';
import { NotificationServiceService } from 'src/app/services/notification-service.service';
import { TopicChannelService } from 'src/app/services/topic-channel.service';

@Component({
  selector: 'app-notification-box',
  templateUrl: './notification-box.component.html',
  styleUrls: ['./notification-box.component.css'],
})
export class NotificationBoxComponent implements OnInit {
  @Input() notificationItems!: Notification[];
  @Input() isSettingPanel!: boolean;
  @Input() settingClass!: boolean;
  temp: any;
  items!: MenuItem[];
  contextMenuOpened!: boolean;
  activeItemId!: string;
  activeUserName!: string;
  isStarredClicked!: boolean;
  activeUserId!: string;
  @ViewChild(OverlayPanel) panel!: OverlayPanel;

  constructor(
    private notificationService: NotificationServiceService,
    private topicChannelService: TopicChannelService
  ) {
    this.notificationService.isStarClicked$.subscribe(
      (isStarClicked) => (this.isStarredClicked = isStarClicked)
    );
  }

  updateItems() {
    this.notificationService.getAllNotifications().subscribe((items) => {
      this.temp = items;
      this.notificationItems = this.temp.notificationLists;
    });
  }

  ngOnInit(): void {
    this.contextMenuOpened = false;
  }

  openContextMenu(
    event: any,
    op: any,
    activeItemId: string,
    userName: string,
    userId: string
  ) {
    if (!this.contextMenuOpened) {
      op.show(event);
      this.activeItemId = activeItemId;
      this.activeUserName = userName;
      this.activeUserId = userId;
      this.contextMenuOpened = true;
    } else {
      op.hide(event);
      this.contextMenuOpened = false;
    }
  }

  closeMenu(op: any) {
    op.hide();
    this.contextMenuOpened = false;
  }

  onStar(id: any) {
    const starIndex = this.notificationItems?.findIndex(
      (item) => item._id == id
    );
    this.notificationItems[starIndex].isStar =
      !this.notificationItems[starIndex].isStar;
    this.notificationService.markItemAsStar(id).subscribe();
  }

  handleMarkAsRead(id: string) {
    this.notificationService.markItemAsRead(id).subscribe();

    //lists after filtered
    const foundIndex = this.notificationItems.findIndex(
      (item) => item._id == id
    );
    this.notificationItems[foundIndex].read = true;
    this.notificationService.isMarkAsRead.next(true);
  }

  handleOnRemove(id: string) {
    this.notificationService.removeItem(id).subscribe();
    //lists after filtered
    const foundIndex = this.notificationItems.findIndex(
      (item) => item._id == id
    );
    if (foundIndex > -1) {
      this.notificationItems.splice(foundIndex, 1);
    }
    this.notificationService.getAllNotifications().subscribe((items) => {
      this.temp = items;
      this.notificationService.updateNotificationLists(
        this.temp.notificationLists
      );
    });
  }

  onHover() {}

  goToContext(channelId: string, courseId: string) {
    const location = {
      courseId: courseId,
      channelId: channelId,
    } as ActiveLocation;
    this.topicChannelService.activeLocation.next(location);
    this.notificationService.isPanelOpened.next(false);
  }
}
