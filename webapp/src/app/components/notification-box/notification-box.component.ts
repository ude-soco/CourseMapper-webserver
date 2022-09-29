import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { NotificationItem } from 'src/app/model/notification-item';
import { MenuItem } from 'primeng/api';
import { OverlayPanel } from 'primeng/overlaypanel';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-notification-box',
  templateUrl: './notification-box.component.html',
  styleUrls: ['./notification-box.component.css'],
})
export class NotificationBoxComponent implements OnInit {
  @Input() notificationItems!: NotificationItem[];
  @Input() isSettingPanel!: boolean;
  @Input() settingClass!: boolean;
  items!: MenuItem[];
  contextMenuOpened!: boolean;
  activeItemId!: string;
  activeUserName!: string;
  isStarredClicked!: boolean;
  @ViewChild(OverlayPanel) panel!: OverlayPanel;

  constructor(private notificationService: NotificationServiceService) {
    this.notificationService.allNotificationItems$.subscribe((allItems) => {
      this.notificationItems = allItems;
    });
    this.notificationService.isStarClicked$.subscribe(
      (isStarClicked) => (this.isStarredClicked = isStarClicked)
    );
  }

  ngOnInit(): void {
    this.contextMenuOpened = false;
  }

  openContextMenu(event: any, op: any, activeItemId: string, userName: string) {
    if (!this.contextMenuOpened) {
      op.show(event);
      this.activeItemId = activeItemId;
      this.activeUserName = userName;
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
      (item) => item.id == id
    );
    this.notificationItems[starIndex].isStar =
      !this.notificationItems[starIndex].isStar;
  }

  handleMarkAsRead(id: string) {
    const starIndex = this.notificationItems?.findIndex(
      (item) => item.id == id
    );
    this.notificationItems[starIndex].read = true;
  }

  handleOnRemove(id: string) {
    const index = this.notificationItems?.findIndex((item) => item.id == id);
    if (index > -1) {
      this.notificationItems.splice(index, 1);
    }
  }

  handleRemoveAll() {
    // this.notificationService.allNotificationItems = [];
    console.log('remove all12356');
  }

  handleMarkAllAsRead() {
    // for (const i of this.notificationItems) {
    //   i.read = true;
    // }
    for (let i = 0; i++; i < this.notificationItems.length) {
      this.notificationItems[i].read = true;
    }
    console.log('mark all as read', this.notificationItems);
  }
}
