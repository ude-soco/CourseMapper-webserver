import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationBellComponent } from './notification-bell/notification-bell.component';
import { NotificationBoxComponent } from './notification-box/notification-box.component';
import { NotificationDashboardComponent } from './notification-dashboard/notification-dashboard.component';
import { PrimengModule } from 'src/app/modules/primeng/primeng.module';
import { TabMenu, TabMenuModule } from 'primeng/tabmenu';
import { MenuModule } from 'primeng/menu';
import { StoreModule } from '@ngrx/store';
import { notificationReducer } from './state/notifications.reducer';
import { EffectsModule } from '@ngrx/effects';
import { NotificationEffects } from './state/notifications.effects';
import { CustomDatePipe } from 'src/app/pipes/date.pipe';

@NgModule({
  declarations: [
    NotificationBellComponent,
    NotificationBoxComponent,
    NotificationDashboardComponent,
    CustomDatePipe,
  ],
  imports: [
    CommonModule,
    PrimengModule,
    TabMenuModule,
    MenuModule,
    StoreModule.forFeature('notifications', notificationReducer),
    EffectsModule.forFeature([NotificationEffects]),
  ],
  exports: [NotificationBellComponent],
})
export class NotificationModule {}
