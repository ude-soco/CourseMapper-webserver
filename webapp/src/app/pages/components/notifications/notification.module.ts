import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationBellComponent } from './notification-bell/notification-bell.component';
import { NotificationBoxComponent } from './notification-box/notification-box.component';
import { NotificationDashboardComponent } from './notification-dashboard/notification-dashboard.component';
import { PrimengModule } from 'src/app/modules/primeng/primeng.module';
import { TabMenu, TabMenuModule } from 'primeng/tabmenu';
import { MenuModule } from 'primeng/menu';

@NgModule({
  declarations: [
    NotificationBellComponent,
    NotificationBoxComponent,
    NotificationDashboardComponent,
  ],
  imports: [CommonModule, PrimengModule, TabMenuModule, MenuModule],
  exports: [NotificationBellComponent],
})
export class NotificationModule {}
