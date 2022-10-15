import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import {
  NotificationItem,
  Notification,
} from 'src/app/model/notification-item';
import { NotificationServiceService } from 'src/app/services/notification-service.service';

@Component({
  selector: 'app-context-menu',
  templateUrl: './context-menu.component.html',
  styleUrls: ['./context-menu.component.css'],
})
export class ContextMenuComponent implements OnInit {
  items!: MenuItem[];
  @Input() activeItemId!: string;
  @Input() activeName!: string;
  @Input() topLevel!: boolean;
  @Input() isSettingPanel!: boolean;
  @Input() activeUserId!: string;
  // to close the menu
  @Output() onClick = new EventEmitter();
  @Output() onMarkRead = new EventEmitter();
  @Output() onRemove = new EventEmitter();
  // top level menu
  @Output() isRemoveAll = new EventEmitter();
  temp: any;
  notificationItems: Notification[] = [];
  label = `Turn off from ${this.activeName} `;
  constructor(
    private router: Router,
    private notificationService: NotificationServiceService
  ) {}

  ngOnInit(): void {
    if (!this.topLevel) {
      if (this.isSettingPanel) {
        this.items = [
          {
            label: 'Mark as read',
            icon: 'pi pi-check',
            command: (event) => this.onMarkAsRead(event, this.activeItemId),
          },
          {
            label: `turn off from ${this.activeName} `,
            icon: 'pi pi-bell',
            command: (event) =>
              this.onTurnOffNotification(event, this.activeUserId),
          },
          {
            label: 'Remove',
            icon: 'pi  pi-times',
            command: (event) => this.onItemRemoved(event, this.activeItemId),
          },
        ];
      } else {
        this.items = [
          {
            label: 'Mark as read',
            icon: 'pi pi-check',
            command: (event) => this.onMarkAsRead(event, this.activeItemId),
          },
          {
            label: 'Remove',
            icon: 'pi  pi-times',
            command: (event) => this.onItemRemoved(event, this.activeItemId),
          },
        ];
      }
    } else {
      this.items = [
        {
          label: 'Mark all as read',
          icon: 'pi pi-check',
          command: () => this.onMarkAllAsRead(),
        },
        {
          label: 'Remove all',
          icon: 'pi  pi-times',
          command: () => this.onRemoveAll(),
        },
        {
          label: 'Settings',
          icon: 'pi pi-cog',
          command: () => this.navigateToSettings(),
        },
      ];
    }
  }

  onMarkAsRead(event: any, activeItemId: string) {
    this.onMarkRead.emit(activeItemId);
    this.onClick.emit();
  }

  onItemRemoved(event: any, activeItemId: string) {
    this.onRemove.emit(activeItemId);
    this.onClick.emit();
  }

  navigateToSettings() {
    this.onClick.emit();
    this.router.navigateByUrl('/notification-settings');
  }
  updateItems() {
    this.notificationService.getAllNotifications().subscribe((items) => {
      this.temp = items;
      this.notificationItems = this.temp.notificationLists;
    });
  }
  onMarkAllAsRead() {
    console.log('mark ALl as read test test');

    this.notificationService.markAllAsRead().subscribe((res) => {
      console.log('response', res);
    });
    this.notificationService.allNotificationItems.value.forEach((element) => {
      element.read = true;
    });

    this.onClick.emit();
  }

  onRemoveAll() {
    this.notificationService.allNotificationItems.next([]);
    this.notificationService.removeAll().subscribe();
    // this.updateItems();
    this.isRemoveAll.emit();
    this.onClick.emit();
  }

  onTurnOffNotification(event: any, activeUserId: string) {
    console.log('on turn off userId', activeUserId);
  }
}
