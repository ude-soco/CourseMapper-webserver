import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Router } from '@angular/router';
import { MenuItem } from 'primeng/api';
import { NotificationItem } from 'src/app/model/notification-item';
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

  // to close the menu
  @Output() onClick = new EventEmitter();
  @Output() onMarkRead = new EventEmitter();
  @Output() onRemove = new EventEmitter();
  // top level menu
  @Output() isRemoveAll = new EventEmitter();
  @Output() isMarkAllAsRead = new EventEmitter();

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
              this.onTurnOffNotification(event, this.activeItemId),
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

  onMarkAllAsRead() {
    console.log('mark ALl as read test test');
    let items: NotificationItem[] = [];
    this.notificationService.allNotificationItems$.subscribe((item) => {
      console.log('item', item);
      items = item;
      items.forEach((element) => {
        element.read = true;
      });
      console.log('items', items);
    });

    this.notificationService.allNotificationItems.next(items);

    this.isMarkAllAsRead.emit();
    this.onClick.emit();
  }

  onRemoveAll() {
    console.log('remove all');
    this.notificationService.allNotificationItems.next([]);

    this.isRemoveAll.emit();
    this.onClick.emit();
  }

  onTurnOffNotification(event: any, activeItemId: string) {
    console.log('on turn off');
  }
}
