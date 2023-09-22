import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { MenuItem } from 'primeng/api';
import * as AppActions from 'src/app/state/app.actions';
import { State } from 'src/app/state/app.reducer';
@Component({
  selector: 'app-tab-menu',
  templateUrl: './tab-menu.component.html',
  styleUrls: ['./tab-menu.component.css'],
})
export class TabMenuComponent {
  @Input() tabOptions: MenuItem[];
  @Input() activeItem: MenuItem;
  @Output() onTabChange: EventEmitter<MenuItem> = new EventEmitter<MenuItem>();
  @Output() onSettingsClicked: EventEmitter<MenuItem> = new EventEmitter();
  constructor(private router: Router, private store: Store<State>) {}

  onTabSwitched(event$) {
    this.onTabChange.emit(event$);
  }

  onSettingsClick(event$) {
    console.log('settings button clicked!!');
    this.store.dispatch(
      AppActions.setShowNotificationsPanel({ showNotificationsPanel: false })
    );
    this.router.navigate(['/settings']);
  }
}
