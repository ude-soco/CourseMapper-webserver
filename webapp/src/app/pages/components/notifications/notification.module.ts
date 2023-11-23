import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationBellComponent } from './notification-bell/notification-bell.component';
import { NotificationBoxComponent } from './notification-box/notification-box.component';
import { NotificationDashboardComponent } from './notification-dashboard/notification-dashboard.component';
import { PrimengModule } from 'src/app/modules/primeng/primeng.module';
import { TabMenuModule } from 'primeng/tabmenu';
import { MenuModule } from 'primeng/menu';
import { StoreModule } from '@ngrx/store';
import { notificationReducer } from './state/notifications.reducer';
import { EffectsModule } from '@ngrx/effects';
import { NotificationEffects } from './state/notifications.effects';
import { CustomDatePipe } from 'src/app/pipes/date.pipe';
import { AllNotificationsComponent } from './all-notifications/all-notifications.component';
import { InputSwitchModule } from 'primeng/inputswitch';
import { SwitchInputComponent } from './switch-input/switch-input.component';
import { CheckboxModule } from 'primeng/checkbox';
import { ReactiveFormsModule } from '@angular/forms';
import { SharedComponentsModule } from 'src/app/components/shared-components.module';
import { BadgeModule } from 'primeng/badge';
import { MultiSelectModule } from 'primeng/multiselect';
import { HighlightPipe } from 'src/app/pipes/highlight.pipe';
import { GlobalLevelNotificationSettingsComponent } from './global-level-notification-settings/global-level-notification-settings.component';
import { SettingsComponent } from './settings/settings.component';
@NgModule({
  declarations: [
    NotificationBellComponent,
    NotificationBoxComponent,
    NotificationDashboardComponent,
    CustomDatePipe,
    AllNotificationsComponent,
    SwitchInputComponent,
    HighlightPipe,
    GlobalLevelNotificationSettingsComponent,
    SettingsComponent,
  ],
  imports: [
    BadgeModule,
    InputSwitchModule,
    CommonModule,
    PrimengModule,
    TabMenuModule,
    MenuModule,
    CheckboxModule,
    StoreModule.forFeature('notifications', notificationReducer),
    EffectsModule.forFeature([NotificationEffects]),
    ReactiveFormsModule,
    SharedComponentsModule,
    MultiSelectModule,
  ],
  exports: [NotificationBellComponent],
})
export class NotificationModule {}
