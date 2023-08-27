import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MenuItem } from 'primeng/api';
import { State } from 'src/app/state/app.state';
import { getActiveAnnotation } from '../annotations/video-annotation/state/video.reducer';
import { getBlockingUsers } from '../notifications/state/notifications.reducer';
import { BlockingNotifications } from 'src/app/models/BlockingNotification';
import { Observable } from 'rxjs';
import { BlockingUsers } from 'src/app/models/Notification';
import * as NotificationActions from '../notifications/state/notifications.actions';
@Component({
  selector: 'app-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css'],
})
export class SettingsComponent {
  protected tabOptions: MenuItem[];
  protected activeItem: MenuItem;
  protected componentToShow: string;
  protected blockingUsers$: Observable<BlockingUsers[]>;
  constructor(protected store: Store<State>, protected router: Router) {}

  ngOnInit() {
    this.tabOptions = [
      {
        label: 'Blocked Users',
        icon: 'pi pi-user',
        command: (event) => {
          this.componentToShow = 'blocked-users';
        },
      },
      {
        label: 'Global notification settings',
        icon: 'pi pi-globe',
        command: (event) => {
          this.componentToShow = 'notification-settings-panel';
        },
      },
    ];

    this.activeItem = this.tabOptions[0];

    this.blockingUsers$ = this.store.select(getBlockingUsers);
  }

  protected onTabSwitched(selectedItem: MenuItem) {
    console.log('tab switch');
    this.activeItem = selectedItem;
    console.log(this.activeItem);
  }

  protected onUnBlockClicked($event, blockedUser: BlockingUsers) {
    $event.stopPropagation();
    this.store.dispatch(
      NotificationActions.unblockUser({ userId: blockedUser._id })
    );
  }
}
